import Stripe from 'stripe';

import { holdEscrowForPaidRequest } from '../lib/postgres/accounts.js';
import { queryOne } from '../lib/postgres/db.js';
import { createShipmentRequestRecord, getPackageById, getShipmentRequestById, getTripById } from '../lib/postgres/shipping.js';
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

function parseBooleanFlag(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === '1';
}

async function finalizeStripeShipmentPayment(paymentIntent) {
  const metadata = paymentIntent?.metadata || {};
  const senderId = metadata.userId;
  const packageId = metadata.packageId;
  const tripId = metadata.tripId;

  if (!senderId || !packageId || !tripId) {
    return null;
  }

  const packageDoc = await getPackageById(packageId);
  if (!packageDoc || packageDoc.userId !== senderId) {
    return null;
  }

  const tripDoc = await getTripById(tripId);
  if (!tripDoc?.userId) {
    return null;
  }

  const currency = String(paymentIntent.currency || metadata.currency || 'usd').toUpperCase();
  const amount = Number(paymentIntent.amount_received || paymentIntent.amount || 0) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const existingRequest = await queryOne(
    `
      select id
      from public.shipment_requests
      where sender_id = $1
        and traveler_id = $2
        and package_id = $3
        and trip_id = $4
        and payment_info ->> 'requestId' = $5
      order by created_at desc
      limit 1
    `,
    [senderId, tripDoc.userId, packageId, tripId, paymentIntent.id],
  );

  const request = existingRequest
    ? await getShipmentRequestById(existingRequest.id)
    : await createShipmentRequestRecord({
        senderId,
        travelerId: tripDoc.userId,
        packageId,
        tripId,
        amount,
        currency,
        imageUrl: null,
        insurance: parseBooleanFlag(metadata.insurance),
        insuranceCost: Number(metadata.insuranceCost || 0),
        estimatedDeparture: metadata.estimatedDeparture
          ? new Date(metadata.estimatedDeparture)
          : (tripDoc.departureDate ? new Date(tripDoc.departureDate) : null),
        estimatedArrival: metadata.estimatedArrival
          ? new Date(metadata.estimatedArrival)
          : (tripDoc.arrivalDate ? new Date(tripDoc.arrivalDate) : null),
        termsAccepted: true,
        paymentInfo: {
          method: 'stripe',
          gateway: 'stripe',
          status: 'paid',
          requestId: paymentIntent.id,
        },
      });

  await holdEscrowForPaidRequest({
    requestId: request.id,
    providerReference: paymentIntent.id,
    provider: 'stripe',
  });

  return request;
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
    const {
      amount,
      travellerName,
      travellerEmail,
      currency = 'usd',
      packageId,
      tripId,
      insurance,
      insuranceCost,
      estimatedDeparture,
      estimatedArrival,
      customerEmail,
    } = req.body;
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
        ...(travellerEmail ? { travellerEmail } : {}),
        ...(customerEmail ? { customerEmail } : {}),
        ...(insurance !== undefined ? { insurance: String(insurance) } : {}),
        ...(insuranceCost !== undefined ? { insuranceCost: String(insuranceCost) } : {}),
        ...(estimatedDeparture ? { estimatedDeparture: String(estimatedDeparture) } : {}),
        ...(estimatedArrival ? { estimatedArrival: String(estimatedArrival) } : {}),
        currency: paymentCurrency.toUpperCase(),
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

export async function handleStripeWebhook(req, res) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ success: false, message: 'Stripe webhook not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Missing Stripe signature' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (error) {
    console.error('❌ Stripe webhook signature verification failed:', error.message);
    return res.status(400).json({ success: false, message: 'Invalid Stripe signature' });
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      await finalizeStripeShipmentPayment(event.data.object);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Stripe webhook handler error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Stripe webhook failed' });
  }
}
