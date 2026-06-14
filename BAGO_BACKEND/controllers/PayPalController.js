import { query, queryOne } from '../lib/postgres/db.js';
import { findProfileById } from '../lib/postgres/profiles.js';
import { getPackageById, getTripById, getShipmentRequestById } from '../lib/postgres/shipping.js';
import { calculateAllInclusivePrice, getFullPricingConfig } from '../services/pricingService.js';
import { convertCurrency } from '../services/currencyConverter.js';
import {
  authorizePaypalOrder as authorizePaypalOrderApi,
  capturePaypalAuthorization as capturePaypalAuthorizationApi,
  createPaypalOrder as createPaypalOrderApi,
  getPaypalClientId,
  isPaypalAdvancedCardsEnabled,
  isPaypalApplePayEnabled,
  voidPaypalAuthorization as voidPaypalAuthorizationApi,
} from '../services/paypalService.js';

let paypalInfraReady = false;

async function ensurePaypalInfrastructure() {
  if (paypalInfraReady) return;
  await query(`
    create table if not exists public.paypal_payments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null,
      request_id uuid,
      package_id uuid,
      trip_id uuid,
      traveler_id uuid,
      paypal_order_id text unique,
      paypal_authorization_id text unique,
      status text not null default 'created',
      amount numeric not null default 0,
      shipment_amount numeric not null default 0,
      traveler_payout numeric not null default 0,
      insurance_cost numeric not null default 0,
      currency text not null default 'USD',
      payment_method text,
      raw_response jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    )
  `);
  await query(`create index if not exists paypal_payments_user_idx on public.paypal_payments(user_id)`);
  await query(`create index if not exists paypal_payments_request_idx on public.paypal_payments(request_id)`);
  paypalInfraReady = true;
}

function publicBaseUrl() {
  return (
    process.env.API_PUBLIC_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    'https://neringa.onrender.com'
  ).replace(/\/+$/, '');
}

function approvalUrlFromOrder(order) {
  const link = Array.isArray(order?.links)
    ? order.links.find((item) => item.rel === 'approve')
    : null;
  return link?.href || '';
}

async function calculateCheckout(req) {
  const senderId = req.user.id || req.user._id;
  const {
    packageId,
    tripId,
    travelerId,
    currency,
    insurance,
  } = req.body || {};

  if (!senderId || !packageId || !tripId || !travelerId) {
    const err = new Error('Package, trip, and traveler are required.');
    err.statusCode = 400;
    throw err;
  }

  const [sender, packageDoc, tripDoc, pricingConfig] = await Promise.all([
    findProfileById(senderId),
    getPackageById(packageId),
    getTripById(tripId),
    getFullPricingConfig(),
  ]);

  if (!sender) {
    const err = new Error('Sender profile not found.');
    err.statusCode = 404;
    throw err;
  }
  if (!packageDoc || packageDoc.userId !== senderId) {
    const err = new Error('Package not found or not owned by sender.');
    err.statusCode = 404;
    throw err;
  }
  if (!tripDoc || tripDoc.userId !== travelerId) {
    const err = new Error('Trip not found or not owned by traveler.');
    err.statusCode = 404;
    throw err;
  }

  const checkoutCurrency = String(currency || sender.currency || tripDoc.currency || 'USD').toUpperCase();
  const tripCurrency = String(tripDoc.currency || checkoutCurrency).toUpperCase();
  const weight = Number(packageDoc.weight || 0);
  const pricePerKg = Number(tripDoc.pricePerKg || tripDoc.price_per_kg || 0);
  const tripTravelerPayout = Number((weight * pricePerKg).toFixed(2));
  const pricing = calculateAllInclusivePrice(tripTravelerPayout, pricingConfig);
  const convertedShipping = tripCurrency === checkoutCurrency
    ? pricing.senderShippingFee
    : Number(Number(await convertCurrency(pricing.senderShippingFee, tripCurrency, checkoutCurrency)).toFixed(2));
  const convertedTravelerPayout = tripCurrency === checkoutCurrency
    ? pricing.travelerPayout
    : Number(Number(await convertCurrency(pricing.travelerPayout, tripCurrency, checkoutCurrency)).toFixed(2));
  const declaredValue = Number(packageDoc.declaredValue ?? packageDoc.value ?? 0);
  const insuranceCost = insurance === true || insurance === 'yes'
    ? Number((declaredValue * (pricingConfig.senderInsurancePercent || 0) / 100).toFixed(2))
    : 0;
  const totalAmount = Number((convertedShipping + insuranceCost).toFixed(2));
  if (totalAmount <= 0) {
    const err = new Error('Checkout amount could not be calculated.');
    err.statusCode = 400;
    throw err;
  }

  return {
    senderId,
    packageDoc,
    tripDoc,
    travelerId,
    packageId,
    tripId,
    amount: totalAmount,
    shipmentAmount: Number(convertedTravelerPayout.toFixed(2)),
    travelerPayout: Number(convertedTravelerPayout.toFixed(2)),
    insuranceCost,
    currency: checkoutCurrency,
  };
}

export async function getPaypalConfig(_req, res) {
  res.json({
    success: true,
    clientId: getPaypalClientId(),
    advancedCardsEligible: isPaypalAdvancedCardsEnabled(),
    applePayEligible: isPaypalApplePayEnabled(),
  });
}

export async function connectPaypalPayout(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const email = req.body?.email?.toString().trim().toLowerCase();
    const currency = req.body?.payoutCurrency?.toString().trim().toUpperCase() || null;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid PayPal email address.' });
    }
    const row = await queryOne(
      `
        update public.profiles
        set payout_provider = 'paypal',
            payout_method = 'paypal',
            payout_method_status = 'connected',
            payout_status = 'active',
            payout_currency = coalesce($3, payout_currency),
            bank_details = coalesce(bank_details, '{}'::jsonb) || $2::jsonb,
            updated_at = timezone('utc', now())
        where id = $1
        returning id, payout_provider, payout_method, payout_method_status, payout_status, payout_currency, bank_details
      `,
      [userId, { paypalEmail: email }, currency],
    );
    res.json({
      success: true,
      message: 'PayPal payout account saved.',
      payout: row,
    });
  } catch (error) {
    console.error('connectPaypalPayout failed:', error.message);
    res.status(500).json({ success: false, message: 'PayPal payout setup could not be saved.' });
  }
}

export async function createPaypalOrder(req, res) {
  try {
    await ensurePaypalInfrastructure();
    const checkout = await calculateCheckout(req);
    const customId = `${checkout.senderId}:${checkout.packageId}:${Date.now()}`;
    const order = await createPaypalOrderApi({
      amount: checkout.amount,
      currency: checkout.currency,
      customId,
      description: 'Bago shipment payment',
      returnUrl: `${publicBaseUrl()}/api/payments/paypal/return`,
      cancelUrl: `${publicBaseUrl()}/api/payments/paypal/cancel`,
    });
    const approvalUrl = approvalUrlFromOrder(order);
    if (!order?.id || !approvalUrl) {
      throw new Error('PayPal approval link was not returned.');
    }

    await query(
      `
        insert into public.paypal_payments (
          user_id, package_id, trip_id, traveler_id, paypal_order_id, status,
          amount, shipment_amount, traveler_payout, insurance_cost, currency,
          payment_method, raw_response
        )
        values ($1,$2,$3,$4,$5,'created',$6,$7,$8,$9,$10,$11,$12)
        on conflict (paypal_order_id) do update
        set raw_response = excluded.raw_response,
            updated_at = timezone('utc', now())
      `,
      [
        checkout.senderId,
        checkout.packageId,
        checkout.tripId,
        checkout.travelerId,
        order.id,
        checkout.amount,
        checkout.shipmentAmount,
        checkout.travelerPayout,
        checkout.insuranceCost,
        checkout.currency,
        req.body?.paymentMethod || 'paypal',
        order,
      ],
    );

    res.json({
      success: true,
      provider: 'paypal',
      orderId: order.id,
      approvalUrl,
      amount: checkout.amount,
      shipmentAmount: checkout.shipmentAmount,
      currency: checkout.currency,
      intent: 'AUTHORIZE',
      advancedCardsEligible: isPaypalAdvancedCardsEnabled(),
      applePayEligible: isPaypalApplePayEnabled(),
    });
  } catch (error) {
    console.error('createPaypalOrder failed:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 503
        ? 'PayPal checkout is not configured yet.'
        : 'PayPal checkout could not be started. Please try again.',
    });
  }
}

export async function authorizePaypalOrder(req, res) {
  try {
    await ensurePaypalInfrastructure();
    const userId = req.user.id || req.user._id;
    const orderId = req.body?.orderId?.toString();
    if (!orderId) return res.status(400).json({ success: false, message: 'PayPal order ID is required.' });

    const payment = await queryOne(
      `select * from public.paypal_payments where paypal_order_id = $1 and user_id = $2 limit 1`,
      [orderId, userId],
    );
    if (!payment) {
      return res.status(404).json({ success: false, message: 'PayPal order was not found for this user.' });
    }

    const authorization = await authorizePaypalOrderApi(orderId);
    const auth = authorization?.purchase_units?.[0]?.payments?.authorizations?.[0];
    const authorizationId = auth?.id;
    if (!authorizationId) {
      throw new Error('PayPal did not return an authorization ID.');
    }

    await query(
      `
        update public.paypal_payments
        set paypal_authorization_id = $2,
            status = $3,
            raw_response = raw_response || $4::jsonb,
            updated_at = timezone('utc', now())
        where paypal_order_id = $1
      `,
      [
        orderId,
        authorizationId,
        String(auth.status || 'AUTHORIZED').toLowerCase(),
        { authorization },
      ],
    );

    res.json({
      success: true,
      provider: 'paypal',
      orderId,
      authorizationId,
      paymentReference: orderId,
      status: 'authorized',
      amount: Number(payment.amount || 0),
      shipmentAmount: Number(payment.shipment_amount || 0),
      currency: payment.currency || 'USD',
    });
  } catch (error) {
    console.error('authorizePaypalOrder failed:', error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: 'PayPal authorization could not be confirmed. Please try again.',
    });
  }
}

async function authorizationIdForRequest(req) {
  const requestId = req.body?.requestId?.toString();
  const explicit = req.body?.authorizationId?.toString();
  if (explicit) return { authorizationId: explicit, requestId };
  if (!requestId) return { authorizationId: null, requestId: null };
  const request = await getShipmentRequestById(requestId);
  return {
    authorizationId: request?.paymentInfo?.authorizationId || null,
    requestId,
  };
}

export async function capturePaypalAuthorization(req, res) {
  try {
    await ensurePaypalInfrastructure();
    const { authorizationId, requestId } = await authorizationIdForRequest(req);
    if (!authorizationId) return res.status(400).json({ success: false, message: 'PayPal authorization ID is required.' });
    const capture = await capturePaypalAuthorizationApi(authorizationId);
    await query(
      `
        update public.paypal_payments
        set status = 'captured',
            raw_response = raw_response || $2::jsonb,
            updated_at = timezone('utc', now())
        where paypal_authorization_id = $1
      `,
      [authorizationId, { capture }],
    );
    if (requestId) {
      await query(
        `
          update public.shipment_requests
          set payment_status = 'paid_escrow',
              payment_info = coalesce(payment_info, '{}'::jsonb) || $2::jsonb,
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [requestId, { status: 'paid_escrow', captureId: capture?.id || null }],
      );
    }
    res.json({ success: true, capture });
  } catch (error) {
    console.error('capturePaypalAuthorization failed:', error.message);
    res.status(error.statusCode || 500).json({ success: false, message: 'PayPal capture failed.' });
  }
}

export async function voidPaypalAuthorization(req, res) {
  try {
    await ensurePaypalInfrastructure();
    const { authorizationId, requestId } = await authorizationIdForRequest(req);
    if (!authorizationId) return res.status(400).json({ success: false, message: 'PayPal authorization ID is required.' });
    const result = await voidPaypalAuthorizationApi(authorizationId);
    await query(
      `
        update public.paypal_payments
        set status = 'voided',
            raw_response = raw_response || $2::jsonb,
            updated_at = timezone('utc', now())
        where paypal_authorization_id = $1
      `,
      [authorizationId, { voided: result || true }],
    );
    if (requestId) {
      await query(
        `
          update public.shipment_requests
          set payment_status = 'voided',
              payment_info = coalesce(payment_info, '{}'::jsonb) || $2::jsonb,
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [requestId, { status: 'voided' }],
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error('voidPaypalAuthorization failed:', error.message);
    res.status(error.statusCode || 500).json({ success: false, message: 'PayPal authorization could not be voided.' });
  }
}

export async function paypalWebhook(req, res) {
  await ensurePaypalInfrastructure().catch(() => {});
  res.json({ received: true });
}

export function paypalReturn(_req, res) {
  res.type('html').send('<!doctype html><html><body><p>Payment approved. You can return to Bago.</p></body></html>');
}

export function paypalCancel(_req, res) {
  res.type('html').send('<!doctype html><html><body><p>Payment cancelled. You can return to Bago.</p></body></html>');
}
