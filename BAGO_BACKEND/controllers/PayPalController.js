import axios from 'axios';
import crypto from 'crypto';

import { holdEscrowForPaidRequest } from '../lib/postgres/accounts.js';
import { query, queryOne } from '../lib/postgres/db.js';
import {
  createNotification,
  createShipmentRequestRecord,
  getPackageById,
  getShipmentRequestById,
  getTripById,
} from '../lib/postgres/shipping.js';
import { activateEarningCurrency, findProfileById } from '../lib/postgres/profiles.js';
import { sendNewRequestToTravelerEmail } from '../services/emailNotifications.js';
import { sendPushNotification } from '../services/pushNotificationService.js';
import { mergePaidDuplicateRequest } from './postgresRequestController.js';
import { resend } from '../services/resendClient.js';

let tokenCache = { accessToken: null, expiresAt: 0 };

const allowedPaymentMethods = new Set(['paypal_wallet', 'apple_pay', 'google_pay', 'card']);
const africanPayoutCurrencies = new Set([
  'AOA', 'BIF', 'BWP', 'CDF', 'CVE', 'DJF', 'DZD', 'EGP', 'ERN', 'ETB',
  'GHS', 'GMD', 'GNF', 'KES', 'KMF', 'LRD', 'LSL', 'LYD', 'MAD', 'MGA',
  'MRU', 'MUR', 'MWK', 'MZN', 'NAD', 'NGN', 'RWF', 'SCR', 'SDG', 'SLE',
  'SOS', 'SSP', 'STN', 'SZL', 'TZS', 'UGX', 'XAF', 'XOF', 'ZAR', 'ZMW',
  'ZWL',
]);

function resolveUserId(req) {
  return req.user?.id || req.user?._id;
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function otpHashMatches(storedHash, otp) {
  const calculatedHash = hashOtp(otp);
  if (!storedHash || storedHash.length !== calculatedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(calculatedHash));
}

function paypalBaseUrl() {
  return String(process.env.PAYPAL_MODE || 'sandbox').toLowerCase() === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function getCommissionRate() {
  const raw = process.env.BAGO_COMMISSION_RATE || process.env.BAGO_COMMISSION_PERCENT || '0.10';
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0.10;
  return parsed > 1 ? parsed / 100 : parsed;
}

function toAmount(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Number(numeric.toFixed(2)) : 0;
}

function normalizeCurrency(value, fallback = 'USD') {
  return String(value || fallback).trim().toUpperCase();
}

function boolFrom(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === '1';
}

function paypalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getPayPalAccessToken() {
  if (!paypalConfigured()) {
    const error = new Error('PayPal is not configured.');
    error.statusCode = 503;
    throw error;
  }

  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString('base64');
  const response = await axios.post(
    `${paypalBaseUrl()}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  tokenCache = {
    accessToken: response.data.access_token,
    expiresAt: Date.now() + Number(response.data.expires_in || 300) * 1000,
  };
  return tokenCache.accessToken;
}

async function paypalRequest(method, path, data, headers = {}) {
  const accessToken = await getPayPalAccessToken();
  const response = await axios({
    method,
    url: `${paypalBaseUrl()}${path}`,
    data,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...headers,
    },
  });
  return response.data;
}

export async function createPayPalEmailPayout({ receiverEmail, amount, currency, reference, note }) {
  return paypalRequest('post', '/v1/payments/payouts', {
    sender_batch_header: {
      sender_batch_id: String(reference || `bago-${Date.now()}`).slice(0, 64),
      email_subject: 'Your Bago payout is on the way',
      email_message: note || 'Bago has sent your payout.',
    },
    items: [
      {
        recipient_type: 'EMAIL',
        receiver: receiverEmail,
        amount: { value: toAmount(amount).toFixed(2), currency: normalizeCurrency(currency) },
        note: note || 'Bago payout',
        sender_item_id: String(reference || Date.now()).slice(0, 64),
      },
    ],
  });
}

async function ensurePayPalTables() {
  await query(`
    create table if not exists public.payments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.profiles(id) on delete cascade,
      shipment_id uuid null references public.shipment_requests(id) on delete set null,
      package_id uuid null references public.packages(id) on delete set null,
      trip_id uuid null references public.trips(id) on delete set null,
      provider text not null default 'paypal',
      payment_method text,
      paypal_order_id text unique,
      paypal_capture_id text,
      amount numeric(14,2) not null default 0,
      currency text not null default 'USD',
      commission_amount numeric(14,2) not null default 0,
      traveler_amount numeric(14,2) not null default 0,
      status text not null default 'pending',
      raw_response jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    )
  `);
  await query(`create index if not exists payments_user_status_idx on public.payments (user_id, status)`);

  await query(`
    create table if not exists public.payouts (
      id uuid primary key default gen_random_uuid(),
      traveler_id uuid not null references public.profiles(id) on delete cascade,
      shipment_id uuid not null references public.shipment_requests(id) on delete cascade,
      provider text not null default 'paypal',
      paypal_email text,
      payout_batch_id text,
      payout_item_id text,
      amount numeric(14,2) not null default 0,
      currency text not null default 'USD',
      status text not null default 'pending',
      failure_reason text,
      raw_response jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    )
  `);
  await query(`create unique index if not exists payouts_shipment_provider_key on public.payouts (shipment_id, provider)`);

  await query(`
    create table if not exists public.payment_events (
      id bigserial primary key,
      provider text not null,
      event_type text not null,
      provider_reference text not null,
      request_id uuid null references public.shipment_requests(id) on delete set null,
      payload jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    )
  `);
  await query(`
    create unique index if not exists payment_events_provider_event_reference_key
      on public.payment_events (provider, event_type, provider_reference)
  `);

  await query(`
    alter table public.profiles
      add column if not exists paypal_email text,
      add column if not exists payout_currency text,
      add column if not exists payout_status text,
      add column if not exists payout_provider text,
      add column if not exists payout_method_status text
  `);
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

async function buildCheckoutQuote({ profile, shipmentId, packageId, tripId, currency, insurance, insuranceCost }) {
  if (shipmentId) {
    const request = await getShipmentRequestById(shipmentId);
    if (!request || request.senderId !== profile.id) {
      const error = new Error('Shipment not found.');
      error.statusCode = 404;
      throw error;
    }
    const commissionAmount = toAmount(Number(request.amount || 0) * getCommissionRate());
    const travelerAmount = toAmount(Math.max(0, Number(request.amount || 0) - commissionAmount - Number(request.insuranceCost || 0)));
    return {
      shipmentId: request.id,
      packageId: request.packageId,
      tripId: request.tripId,
      senderId: request.senderId,
      travelerId: request.travelerId,
      amount: toAmount(request.amount),
      currency: normalizeCurrency(currency || request.currency),
      commissionAmount,
      travelerAmount,
      insurance: request.insurance,
      insuranceCost: toAmount(request.insuranceCost),
    };
  }

  const packageDoc = await getPackageById(packageId);
  if (!packageDoc || packageDoc.userId !== profile.id) {
    const error = new Error('Package not found.');
    error.statusCode = 404;
    throw error;
  }

  const tripDoc = await getTripById(tripId);
  if (!tripDoc?.userId) {
    const error = new Error('Trip not found.');
    error.statusCode = 404;
    throw error;
  }

  const baseAmount = toAmount(Number(packageDoc.packageWeight || 0) * Number(tripDoc.pricePerKg || 0));
  const validatedInsuranceCost = boolFrom(insurance) ? toAmount(insuranceCost) : 0;
  const totalAmount = toAmount(baseAmount + validatedInsuranceCost);
  if (totalAmount <= 0) {
    const error = new Error('Shipment amount could not be calculated.');
    error.statusCode = 400;
    throw error;
  }

  const commissionAmount = toAmount(baseAmount * getCommissionRate());
  const travelerAmount = toAmount(Math.max(0, totalAmount - commissionAmount - validatedInsuranceCost));
  return {
    shipmentId: null,
    packageId: packageDoc.id,
    tripId: tripDoc.id,
    senderId: profile.id,
    travelerId: tripDoc.userId,
    amount: totalAmount,
    currency: normalizeCurrency(currency || tripDoc.currency),
    commissionAmount,
    travelerAmount,
    insurance: boolFrom(insurance),
    insuranceCost: validatedInsuranceCost,
    estimatedDeparture: tripDoc.departureDate,
    estimatedArrival: tripDoc.arrivalDate,
    packageDoc,
    tripDoc,
  };
}

async function finalizePayPalShipmentPayment(payment, capture) {
  if (payment.shipment_id) {
    const request = await getShipmentRequestById(payment.shipment_id);
    if (!request) return null;
    await holdEscrowForPaidRequest({
      requestId: payment.shipment_id,
      providerReference: payment.paypal_order_id,
      provider: 'paypal',
    });
    await query(
      `
        update public.payments
        set raw_response = raw_response || $2::jsonb,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [payment.id, { capture, requestId: payment.shipment_id }],
    );
    return getShipmentRequestById(payment.shipment_id);
  }

  const packageDoc = await getPackageById(payment.package_id);
  const tripDoc = await getTripById(payment.trip_id);
  if (!packageDoc || !tripDoc?.userId) return null;

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
    [payment.user_id, tripDoc.userId, payment.package_id, payment.trip_id, payment.paypal_order_id],
  );

  const duplicateRequest = existingRequest
    ? null
    : await queryOne(
        `
          select sr.id
          from public.shipment_requests sr
          where sr.sender_id = $1
            and sr.traveler_id = $2
            and sr.trip_id = $3
            and sr.status in ('pending', 'accepted')
            and coalesce(sr.payment_info ->> 'requestId', '') <> $4
            and not exists (
              select 1
              from jsonb_array_elements(coalesce(sr.payment_info -> 'payments', '[]'::jsonb)) payment
              where payment ->> 'requestId' = $4
            )
          order by sr.created_at desc
          limit 1
        `,
        [payment.user_id, tripDoc.userId, payment.trip_id, payment.paypal_order_id],
      );

  const request = existingRequest
    ? await getShipmentRequestById(existingRequest.id)
    : duplicateRequest
      ? await mergePaidDuplicateRequest({
          requestId: duplicateRequest.id,
          senderId: payment.user_id,
          incomingPackageId: payment.package_id,
          additionalAmount: Number(payment.amount),
          currency: payment.currency,
          paymentReference: payment.paypal_order_id,
          paymentProvider: 'paypal',
          insurance: payment.raw_response?.quote?.insurance,
          insuranceCost: payment.raw_response?.quote?.insuranceCost,
        })
      : await createShipmentRequestRecord({
          senderId: payment.user_id,
          travelerId: tripDoc.userId,
          packageId: payment.package_id,
          tripId: payment.trip_id,
          amount: Number(payment.amount),
          currency: payment.currency,
          imageUrl: null,
          insurance: boolFrom(payment.raw_response?.quote?.insurance),
          insuranceCost: Number(payment.raw_response?.quote?.insuranceCost || 0),
          estimatedDeparture: tripDoc.departureDate ? new Date(tripDoc.departureDate) : null,
          estimatedArrival: tripDoc.arrivalDate ? new Date(tripDoc.arrivalDate) : null,
          termsAccepted: true,
          paymentInfo: {
            method: 'paypal',
            gateway: 'paypal',
            status: 'paid',
            requestId: payment.paypal_order_id,
            captureId: payment.paypal_capture_id,
          },
        });

  if (!duplicateRequest) {
    await holdEscrowForPaidRequest({
      requestId: request.id,
      providerReference: payment.paypal_order_id,
      provider: 'paypal',
    });
  }

  await query(
    `
      update public.payments
      set shipment_id = $2,
          raw_response = raw_response || $3::jsonb,
          updated_at = timezone('utc', now())
      where id = $1
    `,
    [payment.id, request.id, { capture, requestId: request.id }],
  );

  if (!existingRequest) {
    await Promise.allSettled([
      createNotification({
        userId: request.travelerId,
        title: duplicateRequest ? 'Shipment request updated' : 'New booking received!',
        body: duplicateRequest
          ? `${request.senderName || 'A sender'} added extra kg to an existing request on your trip.`
          : `${request.senderName || 'A sender'} has paid for a shipment on your trip.`,
        type: 'shipment_request',
        payload: { requestId: request.id, tripId: payment.trip_id, merged: Boolean(duplicateRequest) },
      }),
      sendPushNotification(
        request.travelerId,
        duplicateRequest ? 'Shipment request updated' : 'New booking received!',
        duplicateRequest
          ? `${request.senderName || 'A sender'} added extra kg to an existing request.`
          : `${request.senderName || 'A sender'} has paid for a shipment on your trip.`,
        { requestId: request.id, type: 'shipment_request', merged: Boolean(duplicateRequest) },
      ),
      !duplicateRequest && request.traveler?.email
        ? sendNewRequestToTravelerEmail(
            request.traveler.email,
            request.travelerName || 'Traveler',
            request.senderName || 'Sender',
            `${packageDoc.description || 'Package'}, ${packageDoc.packageWeight}kg`,
            tripDoc,
          )
        : Promise.resolve(false),
    ]);
  }

  return request;
}

export async function createPayPalOrder(req, res) {
  try {
    await ensurePayPalTables();
    const profile = await getAuthorizedProfile(req);
    const paymentMethod = String(req.body?.paymentMethod || 'paypal_wallet').trim().toLowerCase();
    if (!allowedPaymentMethods.has(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Unsupported PayPal payment method.' });
    }
    console.info('[payments] create PayPal order', {
      userId: profile.id,
      paymentMethod,
      shipmentId: req.body?.shipmentId || null,
      packageId: req.body?.packageId || null,
      tripId: req.body?.tripId || null,
      currency: req.body?.currency || null,
    });

    const quote = await buildCheckoutQuote({
      profile,
      shipmentId: req.body?.shipmentId,
      packageId: req.body?.packageId,
      tripId: req.body?.tripId,
      currency: req.body?.currency,
      insurance: req.body?.insurance,
      insuranceCost: req.body?.insuranceCost,
    });

    const requestId = crypto.randomUUID();
    const order = await paypalRequest('post', '/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: quote.shipmentId || quote.packageId,
          amount: {
            currency_code: quote.currency,
            value: quote.amount.toFixed(2),
            breakdown: {
              item_total: { currency_code: quote.currency, value: quote.amount.toFixed(2) },
            },
          },
          custom_id: quote.shipmentId || quote.packageId,
          description: 'Bago shipment payment',
        },
      ],
      application_context: {
        brand_name: 'Bago',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.API_PUBLIC_URL || process.env.BACKEND_URL || 'https://neringa.onrender.com'}/api/payments/paypal/return`,
        cancel_url: `${process.env.API_PUBLIC_URL || process.env.BACKEND_URL || 'https://neringa.onrender.com'}/api/payments/paypal/cancel`,
      },
    }, { 'PayPal-Request-Id': requestId });

    const approvalUrl = order.links?.find((link) => link.rel === 'approve')?.href || null;
    await query(
      `
        insert into public.payments (
          user_id, shipment_id, package_id, trip_id, provider, payment_method,
          paypal_order_id, amount, currency, commission_amount, traveler_amount,
          status, raw_response
        )
        values ($1,$2,$3,$4,'paypal',$5,$6,$7,$8,$9,$10,'pending',$11)
        on conflict (paypal_order_id) do update
        set payment_method = excluded.payment_method,
            raw_response = public.payments.raw_response || excluded.raw_response,
            updated_at = timezone('utc', now())
        returning *
      `,
      [
        profile.id,
        quote.shipmentId,
        quote.packageId,
        quote.tripId,
        paymentMethod,
        order.id,
        quote.amount,
        quote.currency,
        quote.commissionAmount,
        quote.travelerAmount,
        { order, quote },
      ],
    );

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        approvalUrl,
        paymentMethod,
        amount: quote.amount,
        currency: quote.currency,
        commissionAmount: quote.commissionAmount,
        travelerAmount: quote.travelerAmount,
      },
    });
  } catch (error) {
    console.error('PayPal create order failed:', error.response?.data || error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'PayPal order could not be created.',
    });
  }
}

export async function capturePayPalOrder(req, res) {
  try {
    await ensurePayPalTables();
    const profile = await getAuthorizedProfile(req);
    const orderId = String(req.body?.orderId || '').trim();
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'PayPal order id is required.' });
    }
    console.info('[payments] capture PayPal order', {
      userId: profile.id,
      orderId,
      shipmentId: req.body?.shipmentId || null,
      packageId: req.body?.packageId || null,
      tripId: req.body?.tripId || null,
    });

    let payment = await queryOne(
      `select * from public.payments where paypal_order_id = $1 and user_id = $2`,
      [orderId, profile.id],
    );
    if (!payment) {
      // SDK-created order (flutter_paypal_native): validate & create record on the fly
      const pkgId = String(req.body?.packageId || '').trim();
      const trpId = String(req.body?.tripId || '').trim();
      if (!pkgId || !trpId) {
        return res.status(404).json({ success: false, message: 'PayPal order was not found.' });
      }
      const ppOrder = await paypalRequest('get', `/v2/checkout/orders/${encodeURIComponent(orderId)}`, null);
      const ppStatus = String(ppOrder.status || '').toUpperCase();
      if (ppStatus !== 'APPROVED' && ppStatus !== 'COMPLETED') {
        return res.status(402).json({ success: false, message: 'PayPal order has not been approved yet.' });
      }
      const ppAmount = toAmount(ppOrder.purchase_units?.[0]?.amount?.value || 0);
      const ppCurrency = normalizeCurrency(ppOrder.purchase_units?.[0]?.amount?.currency_code);
      const quote = await buildCheckoutQuote({
        profile, packageId: pkgId, tripId: trpId,
        currency: ppCurrency,
        insurance: req.body?.insurance,
        insuranceCost: req.body?.insuranceCost,
      });
      if (Math.abs(ppAmount - quote.amount) > 0.05) {
        return res.status(400).json({ success: false, message: 'Payment amount mismatch. Please retry.' });
      }
      // Reuse any existing pending record for the same package+trip to avoid
      // duplicate payment rows on every retry attempt
      const existingPending = await queryOne(
        `select id from public.payments
         where package_id = $1 and trip_id = $2 and user_id = $3 and status = 'pending'
         order by created_at desc limit 1`,
        [pkgId, trpId, profile.id],
      );
      if (existingPending) {
        payment = await queryOne(
          `update public.payments
           set paypal_order_id = $2, raw_response = raw_response || $3::jsonb,
               updated_at = timezone('utc', now())
           where id = $1 returning *`,
          [existingPending.id, orderId, { ppOrder, quote }],
        );
      } else {
        payment = await queryOne(
          `insert into public.payments
             (user_id, package_id, trip_id, provider, payment_method,
              paypal_order_id, amount, currency, commission_amount, traveler_amount, status, raw_response)
           values ($1,$2,$3,'paypal','paypal_wallet',$4,$5,$6,$7,$8,'pending',$9)
           on conflict (paypal_order_id) do update
             set updated_at = timezone('utc', now())
           returning *`,
          [profile.id, pkgId, trpId, orderId,
           quote.amount, quote.currency, quote.commissionAmount, quote.travelerAmount,
           { ppOrder, quote }],
        );
      }
    }
    if (payment.status === 'paid' && payment.shipment_id) {
      return res.json({
        success: true,
        message: 'Payment already captured.',
        data: { orderId, request: await getShipmentRequestById(payment.shipment_id) },
      });
    }

    const capture = await paypalRequest('post', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {});
    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureStatus = String(captureUnit?.status || capture.status || '').toUpperCase();
    const capturedAmount = Number(captureUnit?.amount?.value || 0);
    const capturedCurrency = normalizeCurrency(captureUnit?.amount?.currency_code);
    const expectedAmount = Number(payment.amount);
    const expectedCurrency = normalizeCurrency(payment.currency);

    if (captureStatus !== 'COMPLETED') {
      await query(
        `update public.payments set status = 'failed', raw_response = raw_response || $2::jsonb, updated_at = timezone('utc', now()) where id = $1`,
        [payment.id, { capture }],
      );
      return res.status(402).json({ success: false, message: 'PayPal payment is not complete.' });
    }
    if (capturedCurrency !== expectedCurrency || capturedAmount < expectedAmount - 0.10) {
      await query(
        `update public.payments set status = 'failed', raw_response = raw_response || $2::jsonb, updated_at = timezone('utc', now()) where id = $1`,
        [payment.id, { capture, mismatch: { capturedAmount, capturedCurrency, expectedAmount, expectedCurrency } }],
      );
      return res.status(402).json({ success: false, message: 'PayPal payment amount or currency does not match the shipment.' });
    }

    const updatedPayment = await queryOne(
      `
        update public.payments
        set status = 'paid',
            paypal_capture_id = $2,
            raw_response = raw_response || $3::jsonb,
            updated_at = timezone('utc', now())
        where id = $1
        returning *
      `,
      [payment.id, captureUnit.id, { capture }],
    );
    const request = await finalizePayPalShipmentPayment(updatedPayment, capture);

    return res.json({
      success: true,
      message: 'PayPal payment captured and shipment funded.',
      data: {
        orderId,
        captureId: captureUnit.id,
        request,
      },
    });
  } catch (error) {
    console.error('PayPal capture failed:', error.response?.data || error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'PayPal payment could not be captured.',
    });
  }
}

export async function captureApplePayOrder(req, res) {
  try {
    await ensurePayPalTables();
    const profile = await getAuthorizedProfile(req);

    const { applePayToken, packageId, tripId, currency, insurance, insuranceCost } = req.body || {};
    const pkgId = String(packageId || '').trim();
    const trpId = String(tripId || '').trim();

    if (!applePayToken || !pkgId || !trpId) {
      return res.status(400).json({ success: false, message: 'Missing required payment fields.' });
    }
    console.info('[payments] capture Apple Pay order', {
      userId: profile.id,
      packageId: pkgId,
      tripId: trpId,
      currency: currency || null,
      hasToken: Boolean(applePayToken),
    });

    // Extract encrypted payment fields. Flutter's pay package sends the
    // decoded token body directly, while native PKPaymentToken wrappers use
    // { paymentData: ... }. Accept both so valid Apple Pay tokens do not fail
    // before PayPal is even contacted.
    const paymentData = applePayToken.paymentData || applePayToken;
    const header = paymentData?.header;
    if (!paymentData?.data || !header?.ephemeralPublicKey || !header?.transactionId) {
      return res.status(400).json({ success: false, message: 'Invalid Apple Pay token structure.' });
    }

    // Build expected quote to validate amount
    const quote = await buildCheckoutQuote({
      profile, packageId: pkgId, tripId: trpId,
      currency, insurance, insuranceCost,
    });

    // Step 1: Create PayPal order with the expected amount
    const order = await paypalRequest('post', '/v2/checkout/orders', {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: pkgId,
        amount: {
          currency_code: quote.currency,
          value: quote.amount.toFixed(2),
        },
      }],
    });
    const orderId = order.id;
    if (!orderId) {
      return res.status(500).json({ success: false, message: 'Could not create PayPal order for Apple Pay.' });
    }

    // Step 2: Confirm payment source with the Apple Pay token
    await paypalRequest('post', `/v2/checkout/orders/${encodeURIComponent(orderId)}/confirm-payment-source`, {
      payment_source: {
        apple_pay: {
          token: {
            id: header.transactionId,
            type: 'APPLE_PAY',
            encrypted_key: header.publicKeyHash,
            ephemeral_key: header.ephemeralPublicKey,
            cipher_text: paymentData.data,
            signature: paymentData.signature,
          },
        },
      },
    });

    // Step 3: Capture the order
    const capture = await paypalRequest('post', `/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {});
    const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];
    const captureStatus = String(captureUnit?.status || capture.status || '').toUpperCase();

    if (captureStatus !== 'COMPLETED') {
      return res.status(402).json({ success: false, message: 'Apple Pay payment could not be completed.' });
    }

    // Reuse existing pending record for this package+trip to avoid duplicates on retry
    const existingApplePending = await queryOne(
      `select id from public.payments
       where package_id = $1 and trip_id = $2 and user_id = $3 and status = 'pending'
       order by created_at desc limit 1`,
      [pkgId, trpId, profile.id],
    );
    const payment = existingApplePending
      ? await queryOne(
          `update public.payments
           set paypal_order_id = $2, paypal_capture_id = $3, status = 'paid',
               raw_response = raw_response || $4::jsonb, updated_at = timezone('utc', now())
           where id = $1 returning *`,
          [existingApplePending.id, orderId, captureUnit.id, { order, capture }],
        )
      : await queryOne(
          `insert into public.payments
             (user_id, package_id, trip_id, provider, payment_method,
              paypal_order_id, paypal_capture_id, amount, currency,
              commission_amount, traveler_amount, status, raw_response)
           values ($1,$2,$3,'paypal','apple_pay',$4,$5,$6,$7,$8,$9,'paid',$10)
           on conflict (paypal_order_id) do update
             set status = 'paid', updated_at = timezone('utc', now())
           returning *`,
          [profile.id, pkgId, trpId, orderId, captureUnit.id,
           quote.amount, quote.currency, quote.commissionAmount, quote.travelerAmount,
           { order, capture }],
        );

    const request = await finalizePayPalShipmentPayment(payment, capture);

    return res.json({
      success: true,
      message: 'Apple Pay payment captured and shipment funded.',
      data: { orderId, captureId: captureUnit.id, request },
    });
  } catch (error) {
    const paypalError = error.response?.data;
    console.error('Apple Pay capture failed:', paypalError || error.message);
    const paypalIssue =
      paypalError?.details?.[0]?.description ||
      paypalError?.details?.[0]?.issue ||
      paypalError?.message;
    return res.status(error.statusCode || 500).json({
      success: false,
      message: paypalIssue || error.message || 'Apple Pay payment could not be completed.',
    });
  }
}

export async function getPendingCheckouts(req, res) {
  try {
    await ensurePayPalTables();
    const profile = await getAuthorizedProfile(req);

    const rows = await query(
      `
        SELECT DISTINCT ON (pay.package_id)
          pay.package_id,
          pay.trip_id,
          pay.amount,
          pay.currency,
          pay.created_at AS payment_created_at,
          pkg.from_city,
          pkg.from_country,
          pkg.to_city,
          pkg.to_country,
          pkg.package_weight,
          coalesce((pay.raw_response->'quote'->>'insuranceCost')::numeric, 0) AS insurance_cost
        FROM public.payments pay
        JOIN public.packages pkg ON pkg.id = pay.package_id
        LEFT JOIN public.shipment_requests sr
          ON sr.package_id = pay.package_id
          AND sr.status NOT IN ('rejected', 'cancelled')
        WHERE pay.user_id = $1
          AND pay.status IN ('pending', 'failed')
          AND pay.created_at > now() - interval '48 hours'
          AND sr.id IS NULL
        ORDER BY pay.package_id, pay.created_at DESC
      `,
      [profile.id],
    );

    return res.json({
      success: true,
      data: (rows || []).map(row => ({
        packageId: row.package_id,
        tripId: row.trip_id,
        amount: Number(row.amount),
        currency: row.currency,
        fromLocation: [row.from_city, row.from_country].filter(Boolean).join(', '),
        toLocation: [row.to_city, row.to_country].filter(Boolean).join(', '),
        packageWeight: Number(row.package_weight || 0),
        insurance: Number(row.insurance_cost || 0) > 0,
        insuranceCost: Number(row.insurance_cost || 0),
        createdAt: row.payment_created_at,
      })),
    });
  } catch (error) {
    console.error('getPendingCheckouts failed:', error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Could not load pending checkouts.',
    });
  }
}

export async function savePayPalPayoutSettings(req, res) {
  try {
    await ensurePayPalTables();
    const profile = await getAuthorizedProfile(req);
    const paypalEmail = String(req.body?.paypalEmail || '').trim().toLowerCase();
    const payoutCurrency = normalizeCurrency(req.body?.payoutCurrency || profile.preferredCurrency || 'USD');
    const confirmed = req.body?.confirmed === true;

    if (!paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      return res.status(400).json({ success: false, message: 'A valid PayPal email address is required.' });
    }
    if (africanPayoutCurrencies.has(payoutCurrency)) {
      return res.status(400).json({
        success: false,
        message: `${payoutCurrency} payouts must use Paystack/bank transfer, not PayPal.`,
      });
    }
    if (!confirmed) {
      return res.status(400).json({ success: false, message: 'Please confirm that the PayPal account belongs to you.' });
    }

    await activateEarningCurrency(profile.id, payoutCurrency);

    const user = await queryOne(
      `
        update public.profiles
        set payout_provider = 'paypal',
            payout_method = 'paypal',
            paypal_email = $2,
            payout_currency = $3,
            payout_status = 'active',
            payout_method_status = 'connected',
            updated_at = timezone('utc', now())
        where id = $1
        returning id, paypal_email, payout_currency, payout_status, payout_method_status
      `,
      [profile.id, paypalEmail, payoutCurrency],
    );

    return res.json({ success: true, data: user });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'PayPal payout settings could not be saved.',
    });
  }
}

export async function sendPayPalPayout(req, res) {
  try {
    await ensurePayPalTables();
    const callerId = resolveUserId(req);
    if (!callerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const shipmentId = String(req.body?.shipmentId || '').trim();
    if (!shipmentId) {
      return res.status(400).json({ success: false, message: 'Shipment id is required.' });
    }

    const request = await queryOne(
      `
        select sr.*, p.paypal_email, p.payout_currency, p.payout_status, p.kyc_status
        from public.shipment_requests sr
        join public.profiles p on p.id = sr.traveler_id
        where sr.id = $1
      `,
      [shipmentId],
    );
    if (!request) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    if (String(request.traveler_id) !== String(callerId)) {
      return res.status(403).json({ success: false, message: 'You can only request payout for your own shipment.' });
    }
    if (request.status !== 'completed' || request.sender_received !== true) {
      return res.status(400).json({ success: false, message: 'Shipment is not ready for payout.' });
    }
    if (request.dispute && String(request.dispute?.status || '').toLowerCase() !== 'resolved') {
      return res.status(400).json({ success: false, message: 'A shipment dispute is still open.' });
    }
    if (request.kyc_status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Traveler KYC must be approved before payout.' });
    }
    if (!request.paypal_email || request.payout_status !== 'active') {
      return res.status(400).json({ success: false, message: 'Traveler does not have active PayPal payout settings.' });
    }

    const ledger = await queryOne(
      `select converted_traveler_earning, traveler_earning_amount from public.shipment_ledgers where shipment_id = $1 limit 1`,
      [request.id],
    ).catch(() => null);
    const amount = ledger?.converted_traveler_earning
      ? toAmount(ledger.converted_traveler_earning)
      : toAmount(Math.max(0, Number(request.amount || 0) - Number(request.insurance_cost || 0) - (Number(request.amount || 0) * getCommissionRate())));
    const currency = normalizeCurrency(request.payout_currency || request.currency);
    const senderBatchId = `bago-${shipmentId}-${Date.now()}`.slice(0, 64);
    const payout = await createPayPalEmailPayout({
      receiverEmail: request.paypal_email,
      amount,
      currency,
      reference: senderBatchId,
      note: `Bago payout for shipment ${request.tracking_number || shipmentId}`,
    });

    const item = payout.items?.[0] || {};
    const row = await queryOne(
      `
        insert into public.payouts (
          traveler_id, shipment_id, provider, paypal_email, payout_batch_id,
          payout_item_id, amount, currency, status, raw_response
        )
        values ($1,$2,'paypal',$3,$4,$5,$6,$7,'processing',$8)
        on conflict (shipment_id, provider) do update
        set payout_batch_id = excluded.payout_batch_id,
            payout_item_id = excluded.payout_item_id,
            amount = excluded.amount,
            currency = excluded.currency,
            status = 'processing',
            raw_response = excluded.raw_response,
            updated_at = timezone('utc', now())
        returning *
      `,
      [
        request.traveler_id,
        request.id,
        request.paypal_email,
        payout.batch_header?.payout_batch_id,
        item.payout_item_id || item.payout_item?.payout_item_id,
        amount,
        currency,
        payout,
      ],
    );

    return res.json({ success: true, data: row });
  } catch (error) {
    console.error('PayPal payout failed:', error.response?.data || error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'PayPal payout could not be sent.',
    });
  }
}

async function verifyPayPalWebhook(req) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return false;
  const payload = {
    transmission_id: req.headers['paypal-transmission-id'],
    transmission_time: req.headers['paypal-transmission-time'],
    cert_url: req.headers['paypal-cert-url'],
    auth_algo: req.headers['paypal-auth-algo'],
    transmission_sig: req.headers['paypal-transmission-sig'],
    webhook_id: webhookId,
    webhook_event: req.body,
  };
  const result = await paypalRequest('post', '/v1/notifications/verify-webhook-signature', payload);
  return result.verification_status === 'SUCCESS';
}

export async function paypalWebhook(req, res) {
  try {
    await ensurePayPalTables();
    const verified = await verifyPayPalWebhook(req);
    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid PayPal webhook signature.' });
    }

    const event = req.body || {};
    const eventId = event.id;
    if (eventId) {
      const inserted = await queryOne(
        `
          insert into public.payment_events (provider, event_type, provider_reference, payload)
          values ('paypal', $1, $2, $3)
          on conflict (provider, event_type, provider_reference) do nothing
          returning id
        `,
        [event.event_type || 'paypal_event', eventId, event],
      ).catch(() => null);
      if (!inserted) return res.status(200).json({ received: true, duplicate: true });
    }

    const resource = event.resource || {};
    const type = String(event.event_type || '').toUpperCase();
    const relatedOrderId = resource.supplementary_data?.related_ids?.order_id;

    if (type === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureAmount = Number(resource.amount?.value || 0);
      const captureCurrency = normalizeCurrency(resource.amount?.currency_code);
      const payment = await queryOne(
        `
          select *
          from public.payments
          where paypal_capture_id = $1
             or paypal_order_id = $2
          order by updated_at desc
          limit 1
        `,
        [resource.id, relatedOrderId],
      );

      if (payment) {
        const expectedAmount = Number(payment.amount || 0);
        const expectedCurrency = normalizeCurrency(payment.currency);
        if (
          resource.status &&
          String(resource.status).toUpperCase() === 'COMPLETED' &&
          captureCurrency === expectedCurrency &&
          captureAmount >= expectedAmount * 0.98
        ) {
          const updatedPayment = await queryOne(
            `
              update public.payments
              set status = 'paid',
                  paypal_capture_id = coalesce($1, paypal_capture_id),
                  raw_response = raw_response || $2::jsonb,
                  updated_at = timezone('utc', now())
              where id = $3
              returning *
            `,
            [resource.id, { webhook: event }, payment.id],
          );
          await finalizePayPalShipmentPayment(updatedPayment, { webhook: event });
        } else {
          await query(
            `
              update public.payments
              set status = 'failed',
                  raw_response = raw_response || $2::jsonb,
                  updated_at = timezone('utc', now())
              where id = $1
            `,
            [payment.id, { webhook: event, mismatch: { captureAmount, captureCurrency, expectedAmount, expectedCurrency } }],
          );
        }
      } else {
        await query(
          `
            update public.payments
            set status = 'paid',
                paypal_capture_id = coalesce($1, paypal_capture_id),
                raw_response = raw_response || $2::jsonb,
                updated_at = timezone('utc', now())
            where paypal_capture_id = $1 or paypal_order_id = $3
          `,
          [resource.id, { webhook: event }, relatedOrderId],
        );
      }
    } else if (type === 'PAYMENT.CAPTURE.DENIED' || type === 'PAYMENT.CAPTURE.DECLINED' || type === 'PAYMENT.CAPTURE.FAILED') {
      await query(
        `
          update public.payments
          set status = 'failed',
              raw_response = raw_response || $2::jsonb,
              updated_at = timezone('utc', now())
          where paypal_capture_id = $1 or paypal_order_id = $3
        `,
        [resource.id, { webhook: event }, relatedOrderId],
      );
    } else if (type === 'PAYMENT.CAPTURE.REFUNDED') {
      await query(
        `update public.payments set status = 'refunded', raw_response = raw_response || $2::jsonb, updated_at = timezone('utc', now()) where paypal_capture_id = $1`,
        [resource.links?.find((link) => link.rel === 'up')?.href?.split('/').pop() || resource.id, { webhook: event }],
      );
    } else if (type.startsWith('PAYMENT.PAYOUTS-ITEM.')) {
      const status = type.endsWith('SUCCEEDED') ? 'completed' : type.endsWith('FAILED') ? 'failed' : 'processing';
      const failureReason = resource.errors?.message || null;
      const payout = await queryOne(
        `
          update public.payouts
          set status = $2,
              failure_reason = coalesce($3, failure_reason),
              raw_response = raw_response || $4::jsonb,
              updated_at = timezone('utc', now())
          where payout_item_id = $1
          returning traveler_id, amount, currency
        `,
        [resource.payout_item_id, status, failureReason, { webhook: event }],
      );

      if (payout && status === 'failed') {
        const userFaultCodes = new Set([
          'RECEIVER_ACCOUNT_NOT_FOUND', 'RECEIVER_ACCOUNT_CANNOT_ACCEPT_PAYOUTS',
          'INVALID_RECIPIENT', 'RECEIVER_ACCOUNT_LOCKED', 'RECEIVER_UNREGISTERED',
          'RECEIVER_ACCOUNT_UNCONFIRMED',
        ]);
        const isUserFault = userFaultCodes.has(resource.errors?.name || '');
        const displayAmount = `${payout.currency} ${Number(payout.amount).toFixed(2)}`;
        const userMessage = isUserFault
          ? `Your payout of ${displayAmount} failed — the linked PayPal account may not exist or cannot receive payments. Please update your PayPal payout account and contact support.`
          : `Your payout of ${displayAmount} could not be processed. Our team has been notified and will review it. Contact support if this continues.`;
        await Promise.allSettled([
          createNotification({
            userId: payout.traveler_id,
            title: 'Payout failed',
            body: userMessage,
            type: 'payout_failed',
            payload: { isUserFault },
          }),
          sendPushNotification(payout.traveler_id, 'Payout failed', userMessage, { type: 'payout_failed', isUserFault }),
        ]);
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('PayPal webhook failed:', error.response?.data || error.message);
    return res.status(500).json({ success: false, message: 'PayPal webhook failed.' });
  }
}

export function servePayPalCheckoutPage(req, res) {
  const {
    packageId = '',
    tripId = '',
    shipmentId = '',
    insurance = 'false',
    insuranceCost = '0',
    fromLocation = '',
    toLocation = '',
    // token is passed by Flutter WebView so JS can call backend with auth
    token = '',
  } = req.query;

  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const backendUrl = (process.env.API_PUBLIC_URL || process.env.BACKEND_URL || 'https://neringa.onrender.com').replace(/\/+$/, '');
  const mode = String(req.query.mode || 'app'); // 'app' = Flutter WebView, 'web' = browser
  const checkout = String(req.query.checkout || '').toLowerCase();
  const cardOnly = checkout === 'card';
  const cardFormOnly = mode === 'app' || cardOnly;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<title>Secure checkout</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6fb;-webkit-font-smoothing:antialiased}
body{padding:16px}
.card{background:#fff;border-radius:20px;padding:20px;margin-bottom:14px;box-shadow:0 1px 3px rgba(17,24,39,.05)}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
label{display:block;font-size:13px;font-weight:600;color:#6b7280;margin-bottom:8px}
.field-wrap{background:#f8fafc;border:1.5px solid #e3e7ef;border-radius:14px;height:52px;display:flex;align-items:center;padding:0 14px;transition:border-color .15s,background .15s;overflow:hidden}
.field-wrap:focus-within{border-color:#5845D8;background:#fff}
.field-wrap>div{width:100%;height:100%;display:flex;align-items:center}
.field-wrap iframe{border:0!important;outline:0!important;box-shadow:none!important}
#card-name-input{width:100%;border:none;background:transparent;font-size:15px;font-weight:500;color:#111;outline:none;box-shadow:none}
#card-name-input::placeholder{color:#9ca3af;font-weight:400}
.section-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.section-title{font-size:15px;font-weight:700;color:#111827}
.logos{display:flex;gap:8px;align-items:center}
.pay-btn{width:100%;height:56px;background:#5845D8;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:9px;margin-top:16px;transition:opacity .2s}
.pay-btn:disabled{opacity:.6;cursor:not-allowed}
.divider{display:flex;align-items:center;gap:10px;margin:14px 0}
.div-line{flex:1;height:1px;background:#e5e7eb}
.div-text{font-size:13px;color:#9ca3af;white-space:nowrap}
.pp-btn{width:100%;height:56px;background:#003087;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:12px}
.ap-btn{width:100%;height:56px;background:#000;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;margin-bottom:12px;-webkit-appearance:none;-apple-pay-button-type:plain;-apple-pay-button-style:black}
.footer{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:4px;padding-bottom:20px}
.footer-txt{font-size:12px;color:#9ca3af}
.err{background:#fee2e2;color:#dc2626;padding:12px 16px;border-radius:10px;font-size:13px;margin-top:12px;display:none}
.spin{display:inline-block;width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
#apple-section{display:none}
</style>
</head>
<body>

<!-- Card details section -->
<div class="card">
  <div class="section-hd">
    <span class="section-title">Card details</span>
    <div class="logos">
      <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="4" fill="#1A1F71"/><text x="5" y="16" font-family="Arial" font-size="10" font-weight="bold" fill="#F7B731">VISA</text></svg>
      <svg width="38" height="24" viewBox="0 0 38 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="38" height="24" rx="4" fill="#fff" stroke="#e5e7eb"/><circle cx="15" cy="12" r="7" fill="#EB001B"/><circle cx="23" cy="12" r="7" fill="#F79E1B"/><path d="M19 6.8a7 7 0 010 10.4A7 7 0 0119 6.8z" fill="#FF5F00"/></svg>
    </div>
  </div>

  <label>Card number</label>
  <div class="field-wrap" id="number-wrap"><div id="card-number-field" style="width:100%;height:100%"></div></div>

  <div class="row2" style="margin-top:12px">
    <div>
      <label>Expiry</label>
      <div class="field-wrap" id="expiry-wrap"><div id="card-expiry-field" style="width:100%;height:100%"></div></div>
    </div>
    <div>
      <label>CVV</label>
      <div class="field-wrap" id="cvv-wrap"><div id="card-cvv-field" style="width:100%;height:100%"></div></div>
    </div>
  </div>

  <div style="margin-top:12px">
    <label>Cardholder name (optional)</label>
    <div class="field-wrap">
      <input id="card-name-input" type="text" placeholder="Name on card" autocomplete="cc-name">
    </div>
  </div>

  <button class="pay-btn" id="card-pay-btn" onclick="submitCard()">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    <span id="pay-label">Pay</span>
  </button>
  <div class="err" id="card-err"></div>
</div>

${cardFormOnly ? '' : '<div class="divider"><div class="div-line"></div><span class="div-text">or pay with</span><div class="div-line"></div></div>'}

<!-- PayPal button rendered here by SDK -->
<div id="paypal-btn-container"></div>

${cardFormOnly ? '' : '<div id="apple-section"><button class="ap-btn" id="apple-pay-btn" onclick="startApplePay()">Pay with Apple Pay</button></div>'}

<div class="footer">
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  <span class="footer-txt">Secure checkout</span>
</div>

<script src="https://www.paypal.com/sdk/js?client-id=${clientId}&components=buttons,card-fields,applepay&intent=capture"></script>
<script>
const P = new URLSearchParams(location.search);
const token      = P.get('token') || '${token}';
const packageId  = P.get('packageId') || '${packageId}';
const tripId     = P.get('tripId') || '${tripId}';
const shipmentId = P.get('shipmentId') || '${shipmentId}';
const insurance  = P.get('insurance') === 'true';
const insuranceCost = parseFloat(P.get('insuranceCost') || '${insuranceCost}') || 0;
const mode       = P.get('mode') || '${mode}';
const checkout   = (P.get('checkout') || '${checkout}').toLowerCase();
const cardOnly   = checkout === 'card';
const cardFormOnly = mode === 'app' || cardOnly;
const backend    = '${backendUrl}';

const authHeaders = {'Content-Type':'application/json', 'Authorization': 'Bearer ' + token};

// ── Helpers ──────────────────────────────────────────────────────────────────

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.innerHTML = '<span class="spin"></span>';
  }
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function hideError(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

function updatePayLabel() {
  const el = document.getElementById('pay-label');
  if (!el) return;
  const amt = parseFloat(P.get('amount') || '0');
  const cur = P.get('currency') || 'USD';
  if (amt > 0) el.textContent = 'Pay ' + cur + ' ' + amt.toFixed(2);
  else el.textContent = 'Pay';
}
updatePayLabel();

function notifyFlutter(type, data) {
  try {
    if (window.FlutterBago) {
      window.FlutterBago.postMessage(JSON.stringify({type, ...data}));
    }
  } catch(e) {}
}

async function createOrder(paymentMethod) {
  notifyFlutter('debug', { stage: 'create-order:start', paymentMethod });
  const res = await fetch(backend + '/api/payments/paypal/create-order', {
    method: 'POST',
    headers: authHeaders,
    credentials: 'include',
    body: JSON.stringify({ packageId, tripId, shipmentId: shipmentId || undefined,
      currency: P.get('currency') || 'USD',
      insurance, insuranceCost, paymentMethod })
  });
  const data = await res.json();
  if (!data.success) {
    notifyFlutter('debug', { stage: 'create-order:failed', message: data.message || 'Could not create order' });
    throw new Error(data.message || 'Could not create order');
  }
  notifyFlutter('debug', { stage: 'create-order:success', orderId: data.data.orderId });
  return data.data.orderId;
}

async function captureOrder(orderId) {
  notifyFlutter('debug', { stage: 'capture-order:start', orderId });
  const res = await fetch(backend + '/api/payments/paypal/capture-order', {
    method: 'POST',
    headers: authHeaders,
    credentials: 'include',
    body: JSON.stringify({ orderId })
  });
  const data = await res.json();
  if (!data.success) {
    notifyFlutter('debug', { stage: 'capture-order:failed', message: data.message || 'Payment could not be captured' });
    throw new Error(data.message || 'Payment could not be captured');
  }
  notifyFlutter('debug', { stage: 'capture-order:success', orderId });
  return data.data;
}

// ── Card fields ───────────────────────────────────────────────────────────────

const cardField = paypal.CardFields({
  createOrder: () => createOrder('card'),
  onApprove: async ({ orderID }) => {
    try {
      notifyFlutter('debug', { stage: 'card:onApprove', orderId: orderID });
      const result = await captureOrder(orderID);
      notifyFlutter('success', { orderId: orderID, request: result.request || null });
      if (mode !== 'app') window.location.href = '/shipping-success';
    } catch(e) {
      showError('card-err', e.message);
      setLoading('card-pay-btn', false);
      document.getElementById('card-pay-btn').innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span id="pay-label">Retry</span>';
      notifyFlutter('error', { message: e.message });
    }
  },
  onError: (err) => {
    const msg = err?.message || 'Card payment failed';
    showError('card-err', msg);
    setLoading('card-pay-btn', false);
    notifyFlutter('debug', { stage: 'card:onError', message: msg });
    notifyFlutter('error', { message: msg });
  },
  style: {
    input: {
      'font-size': '15px',
      'font-family': '-apple-system, BlinkMacSystemFont, sans-serif',
      color: '#111827',
      padding: '0',
      border: 'none',
      outline: 'none',
      'box-shadow': 'none',
      background: 'transparent',
    },
    ':focus': { color: '#111827', outline: 'none', border: 'none', 'box-shadow': 'none' },
    '.invalid': { color: '#dc2626' },
  },
});

if (cardField.isEligible()) {
  cardField.NumberField().render('#card-number-field');
  cardField.ExpiryField().render('#card-expiry-field');
  cardField.CVVField().render('#card-cvv-field');
  notifyFlutter('debug', { stage: 'card-fields:ready' });
} else {
  document.querySelector('.card').style.display = 'none';
  notifyFlutter('debug', { stage: 'card-fields:not-eligible' });
  notifyFlutter('error', { message: 'Card payment is not available right now. Please try another card or payment method.' });
}

window.submitCard = function() {
  hideError('card-err');
  setLoading('card-pay-btn', true);
  const name = document.getElementById('card-name-input').value.trim();
  notifyFlutter('debug', { stage: 'card-submit:clicked' });
  cardField.submit(name ? { cardholderName: name } : {}).catch(e => {
    const msg = e.message || 'Please check your card details';
    showError('card-err', msg);
    setLoading('card-pay-btn', false);
    notifyFlutter('debug', { stage: 'card-submit:failed-before-create-order', message: msg });
    notifyFlutter('error', { message: 'Card form error before backend call: ' + msg });
  });
};

// ── PayPal button (web only — popup windows are not supported in WKWebView) ───

if (!cardOnly && mode !== 'app') {
  paypal.Buttons({
    createOrder: () => createOrder('paypal_wallet'),
    onApprove: async ({ orderID }) => {
      try {
        const result = await captureOrder(orderID);
        notifyFlutter('success', { orderId: orderID, request: result.request || null });
        window.location.href = '/shipping-success';
      } catch(e) {
        alert(e.message);
      }
    },
    onError: (err) => { if (mode !== 'app') alert(err?.message || 'PayPal payment failed'); },
    onCancel: () => {},
    style: { layout: 'horizontal', color: 'blue', shape: 'rect', label: 'pay', height: 56, tagline: false },
  }).render('#paypal-btn-container');
} else {
  // In-app/card-only: hide the PayPal wallet section so card checkout never opens PayPal login.
  const ppSection = document.getElementById('paypal-btn-container');
  if (ppSection) ppSection.style.display = 'none';
  const divider = document.querySelector('.divider');
  if (divider) divider.style.display = 'none';
}

// ── Apple Pay ─────────────────────────────────────────────────────────────────

if (!cardFormOnly && window.ApplePaySession && paypal.Applepay) {
  const applepay = paypal.Applepay();
  applepay.config().then(config => {
    if (!config.isEligible) return;
    document.getElementById('apple-section').style.display = 'block';
    window.startApplePay = async function() {
      const orderId = await createOrder('apple_pay').catch(e => { notifyFlutter('error', {message: e.message}); return null; });
      if (!orderId) return;
      const session = new ApplePaySession(3, {
        countryCode: config.countryCode || 'US',
        currencyCode: P.get('currency') || 'USD',
        merchantCapabilities: config.merchantCapabilities || ['supports3DS'],
        supportedNetworks: config.supportedNetworks || ['visa','masterCard','amex'],
        total: { label: 'Bago', amount: (parseFloat(P.get('amount') || '0')).toFixed(2) }
      });
      session.onvalidatemerchant = async (e) => {
        const { merchantSession } = await applepay.validateMerchant({ validationUrl: e.validationURL, orderId });
        session.completeMerchantValidation(merchantSession);
      };
      session.onpaymentauthorized = async (e) => {
        try {
          await applepay.confirmOrder({ orderId, token: e.payment.token, billingContact: e.payment.billingContact });
          const result = await captureOrder(orderId);
          session.completePayment(ApplePaySession.STATUS_SUCCESS);
          notifyFlutter('success', { orderId, request: result.request || null });
          if (mode !== 'app') window.location.href = '/shipping-success';
        } catch(err) {
          session.completePayment(ApplePaySession.STATUS_FAILURE);
          notifyFlutter('error', { message: err.message });
        }
      };
      session.begin();
    };
  }).catch(() => {});
}
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.send(html);
}

export function paypalReturn(_req, res) {
  res.send('<html><body><script>window.close();</script><p>Payment approved. You can return to Bago.</p></body></html>');
}

export function paypalCancel(_req, res) {
  res.send('<html><body><script>window.close();</script><p>Payment cancelled. You can return to Bago.</p></body></html>');
}

/**
 * GET /api/payouts/paypal/oauth/start
 * Returns a PayPal OAuth URL so the user can log in and link their account.
 */
export async function startPayPalOAuth(req, res) {
  try {
    if (!paypalConfigured()) {
      return res.status(503).json({ success: false, message: 'PayPal is not configured.' });
    }
    const profile = await getAuthorizedProfile(req);

    await query(`
      alter table public.profiles
        add column if not exists paypal_oauth_state jsonb,
        add column if not exists paypal_payer_id text
    `).catch(() => {});

    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const returnTo = String(req.query?.returnTo || '').toLowerCase() === 'web' ? 'web' : 'app';
    await query(
      `update public.profiles set paypal_oauth_state = $2, updated_at = timezone('utc', now()) where id = $1`,
      [profile.id, { state, expiresAt, returnTo }],
    );

    const isLive = String(process.env.PAYPAL_MODE || 'sandbox').toLowerCase() === 'live';
    const authBase = isLive ? 'https://www.paypal.com' : 'https://www.sandbox.paypal.com';
    const backendUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_URL || 'https://neringa.onrender.com';
    const redirectUri = `${backendUrl}/api/payouts/paypal/oauth/callback`;

    const oauthUrl = new URL(`${authBase}/signin/authorize`);
    oauthUrl.searchParams.set('client_id', process.env.PAYPAL_CLIENT_ID);
    oauthUrl.searchParams.set('response_type', 'code');
    oauthUrl.searchParams.set('scope', 'openid email https://uri.paypal.com/services/paypalattributes');
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('state', state);

    return res.json({ success: true, oauthUrl: oauthUrl.toString(), redirectUri });
  } catch (error) {
    console.error('startPayPalOAuth error:', error.message);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Could not start PayPal login.' });
  }
}

/**
 * GET /api/payouts/paypal/oauth/callback
 * PayPal redirects here after the user logs in. Exchanges the code, saves the
 * PayPal email, then redirects back to the app via deep link.
 */
export async function handlePayPalOAuthCallback(req, res) {
  const appScheme = process.env.APP_SCHEME || 'com.bago.mobile';
  const deepLinkBase = `${appScheme}://paypal-callback`;

  const deepLink = (params) => {
    res.status(302).setHeader('Location', `${deepLinkBase}?${params}`).end();
  };
  const webReturn = (params) => {
    const frontendUrl = (process.env.WEBAPP_URL || process.env.FRONTEND_URL || 'https://sendwithbago.com').replace(/\/+$/, '');
    res.status(302).setHeader('Location', `${frontendUrl}/dashboard?tab=settings&${params}`).end();
  };

  const { code, state, error: oauthError } = req.query;
  if (oauthError || !code || !state) {
    return deepLink('status=failed&reason=cancelled');
  }

  try {
    const profile = await queryOne(
      `select id, paypal_oauth_state, preferred_currency, payout_currency from public.profiles where paypal_oauth_state->>'state' = $1`,
      [state],
    );
    if (!profile) return deepLink('status=failed&reason=invalid_state');

    const stateData = profile.paypal_oauth_state;
    const finish = (params) => stateData?.returnTo === 'web' ? webReturn(params) : deepLink(params);
    if (new Date() > new Date(stateData.expiresAt)) {
      return finish('paypal=failed&reason=expired');
    }

    const backendUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_URL || 'https://neringa.onrender.com';
    const redirectUri = `${backendUrl}/api/payouts/paypal/oauth/callback`;
    const credentials = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64');

    const tokenRes = await axios.post(
      `${paypalBaseUrl()}/v1/oauth2/token`,
      new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }).toString(),
      { headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    const userToken = tokenRes.data.access_token;

    const userInfoRes = await axios.get(
      `${paypalBaseUrl()}/v1/identity/openidconnect/userinfo?schema=openid`,
      { headers: { Authorization: `Bearer ${userToken}` } },
    );

    const paypalEmail = String(userInfoRes.data.email || '').trim().toLowerCase();
    const paypalPayerId = userInfoRes.data.payer_id || userInfoRes.data.sub || null;

    if (!paypalEmail) {
      return finish('paypal=failed&reason=no_email');
    }
    if (africanPayoutCurrencies.has(normalizeCurrency(profile.payout_currency || profile.preferred_currency || 'USD'))) {
      return finish('paypal=failed&reason=wrong_currency');
    }

    const payoutCurrency = normalizeCurrency(profile.payout_currency || profile.preferred_currency || 'USD');
    await activateEarningCurrency(profile.id, payoutCurrency);

    await query(
      `update public.profiles
       set payout_provider = 'paypal',
           payout_method = 'paypal',
           paypal_email = $2,
           paypal_payer_id = $3,
           payout_currency = $4,
           payout_status = 'active',
           payout_method_status = 'connected',
           paypal_oauth_state = null,
           updated_at = timezone('utc', now())
       where id = $1`,
      [profile.id, paypalEmail, paypalPayerId, payoutCurrency],
    );

    return finish(`paypal=success&email=${encodeURIComponent(paypalEmail)}`);
  } catch (error) {
    console.error('handlePayPalOAuthCallback error:', error.response?.data || error.message);
    return deepLink('status=failed&reason=server_error');
  }
}

/**
 * POST /api/payouts/paypal/send-otp
 * Sends a 6-digit OTP to the provided PayPal email to verify ownership.
 */
export async function sendPayPalPayoutOtp(req, res) {
  try {
    await ensurePayPalTables();
    const profile = await getAuthorizedProfile(req);

    const paypalEmail = String(req.body?.paypalEmail || '').trim().toLowerCase();
    const payoutCurrency = normalizeCurrency(req.body?.payoutCurrency || profile.preferredCurrency || 'USD');

    if (!paypalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      return res.status(400).json({ success: false, message: 'A valid PayPal email address is required.' });
    }
    if (africanPayoutCurrencies.has(payoutCurrency)) {
      return res.status(400).json({
        success: false,
        message: `${payoutCurrency} payouts use Paystack bank transfer, not PayPal.`,
      });
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await query(
      `alter table public.profiles add column if not exists paypal_pending_setup jsonb`,
    ).catch(() => {});

    await query(
      `update public.profiles
       set paypal_pending_setup = $2, updated_at = timezone('utc', now())
       where id = $1`,
      [profile.id, JSON.stringify({ email: paypalEmail, currency: payoutCurrency, otpHash: hashOtp(otp), expiresAt })],
    );

    if (!resend?.emails?.send) {
      return res.status(503).json({ success: false, message: 'Email service not configured. Contact support.' });
    }

    const { error: emailError } = await resend.emails.send({
      from: 'Bago <no-reply@sendwithbago.com>',
      to: paypalEmail,
      subject: 'Verify your Bago PayPal payout account',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#111827">
          <h2 style="color:#003087;margin:0 0 18px">Verify your PayPal payout account</h2>
          <p>Hi ${profile.first_name || 'there'},</p>
          <p>You are linking <strong>${paypalEmail}</strong> as your Bago payout account.</p>
          <p>Enter this 6-digit code in the app to confirm. It expires in 30 minutes.</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#003087;margin:24px 0;text-align:center">${otp}</div>
          <p style="color:#6b7280;font-size:13px">If you did not request this, contact Bago support immediately.</p>
        </div>
      `,
    });

    if (emailError) {
      console.error('PayPal OTP email error:', emailError);
      return res.status(502).json({ success: false, message: 'Could not send verification email. Please try again.' });
    }

    return res.json({
      success: true,
      requiresOtp: true,
      message: `A 6-digit code has been sent to ${paypalEmail}`,
    });
  } catch (error) {
    console.error('sendPayPalPayoutOtp error:', error.message);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to send OTP.' });
  }
}

/**
 * POST /api/payouts/paypal/verify-otp
 * Verifies OTP and saves the PayPal payout settings.
 */
export async function verifyPayPalPayoutOtp(req, res) {
  try {
    await ensurePayPalTables();
    const profile = await getAuthorizedProfile(req);
    const otp = String(req.body?.otp || '').trim();

    if (!otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'A valid 6-digit code is required.' });
    }

    const row = await queryOne(
      `select paypal_pending_setup from public.profiles where id = $1`,
      [profile.id],
    );

    const pending = row?.paypal_pending_setup;
    if ((!pending?.otpHash && !pending?.otp) || !pending?.email) {
      return res.status(400).json({ success: false, message: 'No pending PayPal verification found. Please start again.' });
    }
    if (new Date() > new Date(pending.expiresAt)) {
      return res.status(400).json({ success: false, message: 'Code has expired. Please request a new one.' });
    }
    const otpMatches = pending.otpHash
      ? otpHashMatches(pending.otpHash, otp)
      : pending.otp === otp;

    if (!otpMatches) {
      return res.status(400).json({ success: false, message: 'Incorrect code. Please try again.' });
    }

    await activateEarningCurrency(profile.id, pending.currency);

    const user = await queryOne(
      `update public.profiles
       set payout_provider = 'paypal',
           payout_method = 'paypal',
           paypal_email = $2,
           payout_currency = $3,
           payout_status = 'active',
           payout_method_status = 'connected',
           paypal_pending_setup = null,
           updated_at = timezone('utc', now())
       where id = $1
       returning id, paypal_email, payout_currency, payout_status, payout_method_status`,
      [profile.id, pending.email, pending.currency],
    );

    return res.json({ success: true, message: 'PayPal payout account verified and saved.', data: user });
  } catch (error) {
    console.error('verifyPayPalPayoutOtp error:', error.message);
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || 'OTP verification failed.' });
  }
}
