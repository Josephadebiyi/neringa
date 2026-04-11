import Stripe from 'stripe';

import { findProfileById, updateStripeConnectState } from '../lib/postgres/profiles.js';

let stripeClient = null;

function getStripeClient() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey || stripeKey === 'your_stripe_secret_key' || !stripeKey.startsWith('sk_')) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(stripeKey);
  }

  return stripeClient;
}

function resolveUserId(req) {
  return req.user?.id || req.user?._id;
}

async function getAuthorizedProfile(req) {
  const userId = resolveUserId(req);
  if (!userId) {
    const error = new Error('Unauthorized');
    error.statusCode = 403;
    throw error;
  }

  const profile = await findProfileById(userId);
  if (!profile) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return profile;
}

async function ensureStripeCustomer(profile, stripe) {
  if (profile.stripeAccountId && String(profile.stripeAccountId).startsWith('cus_')) {
    return profile.stripeAccountId;
  }

  const customer = await stripe.customers.create({
    email: profile.email,
    name: [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || profile.email,
    metadata: { userId: profile.id },
  });

  await updateStripeConnectState(profile.id, { stripeAccountId: customer.id });
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

export async function listPaymentMethods(req, res) {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Payment service not configured' });
  }

  try {
    const profile = await getAuthorizedProfile(req);
    const customerId = await ensureStripeCustomer(profile, stripe);
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Could not load payment methods.',
    });
  }
}

export async function createSetupIntent(req, res) {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Payment service not configured' });
  }

  try {
    const profile = await getAuthorizedProfile(req);
    const customerId = await ensureStripeCustomer(profile, stripe);
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-06-20' },
    );
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: { userId: profile.id },
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Could not start card setup.',
    });
  }
}

export async function attachPaymentMethod(req, res) {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Payment service not configured' });
  }

  try {
    const profile = await getAuthorizedProfile(req);
    const customerId = await ensureStripeCustomer(profile, stripe);
    const paymentMethodId = req.body?.paymentMethodId;

    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'Payment method id is required.' });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer && paymentMethod.customer !== customerId) {
      return res.status(403).json({ success: false, message: 'This card belongs to a different customer.' });
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Could not save card.',
    });
  }
}

export async function createCustomerPaymentIntent(req, res) {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Payment service not configured' });
  }

  try {
    const profile = await getAuthorizedProfile(req);
    const { amount, travellerName, travellerEmail, currency = 'usd', packageId, tripId } = req.body;
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }

    const customerId = await ensureStripeCustomer(profile, stripe);
    const paymentCurrency = String(currency || 'usd').toLowerCase();
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customerId },
      { apiVersion: '2024-06-20' },
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount * 100),
      currency: paymentCurrency,
      customer: customerId,
      receipt_email: travellerEmail || profile.email,
      metadata: {
        userId: profile.id,
        ...(packageId ? { packageId: String(packageId) } : {}),
        ...(tripId ? { tripId: String(tripId) } : {}),
        ...(travellerName ? { travellerName } : {}),
      },
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Could not start payment.',
    });
  }
}

export async function deletePaymentMethod(req, res) {
  const stripe = getStripeClient();
  if (!stripe) {
    return res.status(503).json({ success: false, message: 'Payment service not configured' });
  }

  try {
    const profile = await getAuthorizedProfile(req);
    const customerId = await ensureStripeCustomer(profile, stripe);
    const paymentMethodId = req.params.paymentMethodId;

    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'Payment method id is required.' });
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    if (paymentMethod.customer !== customerId) {
      return res.status(403).json({ success: false, message: 'This card does not belong to the current user.' });
    }

    await stripe.paymentMethods.detach(paymentMethodId);
    return res.json({ success: true, message: 'Payment method removed.' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Could not remove payment method.',
    });
  }
}
