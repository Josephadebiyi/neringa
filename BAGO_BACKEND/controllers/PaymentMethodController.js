import Stripe from 'stripe';
import User from '../models/userScheme.js';

function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === 'your_stripe_secret_key' || !stripeKey.startsWith('sk_')) {
    return null;
  }

  return new Stripe(stripeKey);
}

async function ensureStripeCustomer(user, stripe) {
  if (!user) {
    throw new Error('User is required');
  }

  if (user.stripeAccountId && user.stripeAccountId.startsWith('cus_')) {
    return user.stripeAccountId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email,
    metadata: {
      userId: user._id.toString(),
    },
  });

  user.stripeAccountId = customer.id;
  await user.save();
  return customer.id;
}

function serializeCard(paymentMethod) {
  const card = paymentMethod.card || {};
  return {
    id: paymentMethod.id,
    brand: card.brand || 'card',
    last4: card.last4 || '',
    expMonth: card.exp_month || 0,
    expYear: card.exp_year || 0,
  };
}

export const listPaymentMethods = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured.',
      });
    }

    const user = req.user || (await User.findById(req.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const customerId = await ensureStripeCustomer(user, stripe);
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    return res.json({
      success: true,
      data: {
        customerId,
        cards: paymentMethods.data.map(serializeCard),
      },
    });
  } catch (error) {
    console.error('❌ List payment methods error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not load payment methods.',
    });
  }
};

export const createSetupIntent = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured.',
      });
    }

    const user = req.user || (await User.findById(req.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const customerId = await ensureStripeCustomer(user, stripe);
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-06-20' },
    );
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        userId: user._id.toString(),
      },
    });

    return res.json({
      success: true,
      data: {
        customerId,
        customerEphemeralKeySecret: ephemeralKey.secret,
        setupIntentClientSecret: setupIntent.client_secret,
      },
    });
  } catch (error) {
    console.error('❌ Create setup intent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not start card setup.',
    });
  }
};

export const attachPaymentMethod = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured.',
      });
    }

    const { paymentMethodId } = req.body;
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method id is required.',
      });
    }

    const user = req.user || (await User.findById(req.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const customerId = await ensureStripeCustomer(user, stripe);
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer && paymentMethod.customer !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'This card belongs to a different customer.',
      });
    }

    const attachedPaymentMethod = paymentMethod.customer === customerId
      ? paymentMethod
      : await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customerId,
        });

    return res.json({
      success: true,
      data: {
        customerId,
        card: serializeCard(attachedPaymentMethod),
      },
    });
  } catch (error) {
    console.error('❌ Attach payment method error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not save card.',
    });
  }
};

export const createCustomerPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured.',
      });
    }

    const user = req.user || (await User.findById(req.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { amount, travellerName, travellerEmail, currency = 'usd' } = req.body;
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: amount.',
      });
    }

    const paymentCurrency = String(currency || 'usd').toLowerCase();
    const stripeAmount = Math.round(Number(amount) * 100);
    const customerId = await ensureStripeCustomer(user, stripe);
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-06-20' },
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: stripeAmount,
      currency: paymentCurrency,
      customer: customerId,
      receipt_email: travellerEmail || user.email,
      metadata: {
        travellerName: travellerName || user.email,
        userId: user._id.toString(),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return res.json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        currency: paymentCurrency,
        customerId,
        customerEphemeralKeySecret: ephemeralKey.secret,
      },
    });
  } catch (error) {
    console.error('❌ Create customer payment intent error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not start payment.',
    });
  }
};

export const deletePaymentMethod = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: 'Stripe is not configured.',
      });
    }

    const { paymentMethodId } = req.params;
    if (!paymentMethodId) {
      return res.status(400).json({
        success: false,
        message: 'Payment method id is required.',
      });
    }

    const user = req.user || (await User.findById(req.userId));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const customerId = await ensureStripeCustomer(user, stripe);
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== customerId) {
      return res.status(403).json({
        success: false,
        message: 'This card does not belong to the current user.',
      });
    }

    await stripe.paymentMethods.detach(paymentMethodId);

    return res.json({
      success: true,
      message: 'Payment method removed.',
    });
  } catch (error) {
    console.error('❌ Delete payment method error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not remove payment method.',
    });
  }
};
