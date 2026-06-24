import { query, queryOne, withTransaction } from '../lib/postgres/db.js';
import { findProfileById } from '../lib/postgres/profiles.js';
import { getPackageById, getTripById, getShipmentRequestById } from '../lib/postgres/shipping.js';
import { calculateAllInclusivePrice, getFullPricingConfig } from '../services/pricingService.js';
import { convertCurrency } from '../services/currencyConverter.js';
import { sendWithdrawalSubmittedEmail, sendWithdrawalAdminNotification } from '../services/emailNotifications.js';
import { listActiveAdminEmails } from '../lib/postgres/trips.js';
import { assertNoActiveWithdrawal } from '../services/withdrawalSafety.js';
import {
  capturePaypalOrder as capturePaypalOrderApi,
  createPaypalOrder as createPaypalOrderApi,
  createPaypalPayout as createPaypalPayoutApi,
  getPaypalBuyerCountry,
  getPaypalClientId,
  getPaypalMerchantId,
  isPaypalAdvancedCardsEnabled,
  isPaypalApplePayEnabled,
  voidPaypalAuthorization as voidPaypalAuthorizationApi,
} from '../services/paypalService.js';

let paypalInfraReady = false;

function serializePaypalPayoutError(error) {
  return {
    statusCode: error?.statusCode || null,
    message: error?.message || null,
    name: error?.details?.name || error?.details?.error || null,
    debugId: error?.details?.debug_id || error?.details?.debugId || null,
    details: error?.details || null,
  };
}

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
      paypal_capture_id text unique,
      status text not null default 'created',
      amount numeric not null default 0,
      shipment_amount numeric not null default 0,
      traveler_payout numeric not null default 0,
      insurance_cost numeric not null default 0,
      currency text not null default 'USD',
      payment_method text,
      error_message text,
      raw_response jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    )
  `);
  await query(`create index if not exists paypal_payments_user_idx on public.paypal_payments(user_id)`);
  await query(`create index if not exists paypal_payments_request_idx on public.paypal_payments(request_id)`);
  await query(`alter table public.paypal_payments add column if not exists paypal_capture_id text unique`);
  await query(`alter table public.paypal_payments add column if not exists error_message text`);
  await query(`
    alter table public.wallet_transactions
      add column if not exists updated_at timestamptz not null default timezone('utc', now())
  `).catch((error) => {
    console.warn('wallet_transactions.updated_at could not be ensured:', error.message);
  });
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
    alter table public.payment_events
      add column if not exists updated_at timestamptz not null default timezone('utc', now())
  `);
  await query(`
    create unique index if not exists payment_events_provider_event_reference_key
      on public.payment_events (provider, event_type, provider_reference)
  `);
  paypalInfraReady = true;
}

async function recordPaypalEvent({ eventType, providerReference, requestId = null, payload = {} }) {
  if (!providerReference) return;
  await ensurePaypalInfrastructure();
  await query(
    `
      insert into public.payment_events (provider, event_type, provider_reference, request_id, payload)
      values ('paypal', $1, $2, $3, $4)
      on conflict (provider, event_type, provider_reference) do update
      set request_id = coalesce(excluded.request_id, public.payment_events.request_id),
          payload = public.payment_events.payload || excluded.payload,
          updated_at = timezone('utc', now())
    `,
    [eventType, providerReference, requestId, payload],
  ).catch((error) => {
    console.warn('PayPal payment event could not be recorded:', error.message);
  });
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
    requestId,
    additionalKg,
  } = req.body || {};

  const parsedAdditionalKg = Number(additionalKg || 0);
  if (requestId && parsedAdditionalKg > 0) {
    const existing = await queryOne(
      `
        select sr.id, sr.package_id, sr.trip_id, sr.traveler_id, sr.currency,
               p.declared_value, t.currency as trip_currency, t.price_per_kg
        from public.shipment_requests sr
        join public.packages p on p.id = sr.package_id
        join public.trips t on t.id = sr.trip_id
        where sr.id = $1
          and sr.sender_id = $2
          and sr.status in ('pending', 'accepted')
        limit 1
      `,
      [requestId, senderId],
    );
    if (!existing) {
      const err = new Error('Active shipment request was not found.');
      err.statusCode = 404;
      throw err;
    }
    const pricingConfig = await getFullPricingConfig();
    const checkoutCurrency = String(currency || existing.currency || existing.trip_currency || 'USD').toUpperCase();
    const tripCurrency = String(existing.trip_currency || checkoutCurrency).toUpperCase();
    const pricePerKg = Number(existing.price_per_kg || 0);
    const tripTravelerPayout = Number((parsedAdditionalKg * pricePerKg).toFixed(2));
    const pricing = calculateAllInclusivePrice(tripTravelerPayout, pricingConfig);
    const convertedShipping = tripCurrency === checkoutCurrency
      ? pricing.senderShippingFee
      : Number(Number(await convertCurrency(pricing.senderShippingFee, tripCurrency, checkoutCurrency)).toFixed(2));
    const convertedTravelerPayout = tripCurrency === checkoutCurrency
      ? pricing.travelerPayout
      : Number(Number(await convertCurrency(pricing.travelerPayout, tripCurrency, checkoutCurrency)).toFixed(2));
    const totalAmount = Number(convertedShipping.toFixed(2));
    if (totalAmount <= 0) {
      const err = new Error('Additional kg amount could not be calculated.');
      err.statusCode = 400;
      throw err;
    }
    return {
      senderId,
      packageId: existing.package_id,
      tripId: existing.trip_id,
      travelerId: existing.traveler_id,
      amount: totalAmount,
      shipmentAmount: Number(convertedTravelerPayout.toFixed(2)),
      travelerPayout: Number(convertedTravelerPayout.toFixed(2)),
      insuranceCost: 0,
      currency: checkoutCurrency,
      additionalKg: parsedAdditionalKg,
      targetRequestId: existing.id,
    };
  }

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
  const weight = Number(packageDoc.packageWeight || packageDoc.weight || packageDoc.package_weight || 0);
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
    environment: process.env.PAYPAL_ENV === 'sandbox' ? 'sandbox' : 'live',
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
      paypalPayoutEmail: email,
      payout: row,
    });
  } catch (error) {
    console.error('connectPaypalPayout failed:', error.message);
    res.status(500).json({ success: false, message: 'PayPal payout setup could not be saved.' });
  }
}

export async function withdrawPaypalPayout(req, res) {
  const userId = req.user.id || req.user._id;
  const amount = Number(req.body?.amount || 0);
  const requestedCurrency = req.body?.currency?.toString().trim().toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Enter a valid withdrawal amount.' });
  }

  let transactionId = null;
  let walletCurrency = requestedCurrency || 'USD';
  const senderBatchId = `BAGO-PAYPAL-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  try {
    await ensurePaypalInfrastructure();
    const prepared = await withTransaction(async (client) => {
      const accountResult = await client.query(
        `
          select p.bank_details, p.payout_provider, p.payout_method, p.payout_status,
                 p.email, p.first_name, p.last_name,
                 wa.id as wallet_id, wa.available_balance, wa.currency
          from public.profiles p
          join public.wallet_accounts wa on wa.user_id = p.id
          where p.id = $1
          for update
        `,
        [userId],
      );
      const account = accountResult.rows[0];
      if (!account) {
        const err = new Error('Wallet not found.');
        err.statusCode = 404;
        throw err;
      }
      const paypalEmail = account.bank_details?.paypalEmail || account.bank_details?.paypal_email;
      if (!paypalEmail) {
        const err = new Error('Add your PayPal payout email before withdrawing.');
        err.statusCode = 400;
        throw err;
      }
      walletCurrency = String(account.currency || requestedCurrency || 'USD').toUpperCase();
      if (requestedCurrency && requestedCurrency !== walletCurrency) {
        const err = new Error(`Wallet currency is ${walletCurrency}.`);
        err.statusCode = 400;
        throw err;
      }
      if (Number(account.available_balance || 0) < amount) {
        const err = new Error('Insufficient available balance.');
        err.statusCode = 400;
        throw err;
      }
      await assertNoActiveWithdrawal(client, userId);

      await client.query(
        `
          update public.wallet_accounts
          set available_balance = available_balance - $2,
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [account.wallet_id, amount],
      );
      const txResult = await client.query(
        `
          insert into public.wallet_transactions
            (wallet_id, user_id, type, amount, currency, status, description, metadata)
          values ($1,$2,'withdrawal',$3,$4,'pending_admin_approval',$5,$6)
          returning id
        `,
        [
          account.wallet_id,
          userId,
          amount,
          walletCurrency,
          'PayPal withdrawal',
          { provider: 'paypal', paypalEmail, senderBatchId },
        ],
      );
      return {
        walletId: account.wallet_id,
        transactionId: txResult.rows[0]?.id,
        paypalEmail,
        userEmail: account.email,
        userName: [account.first_name, account.last_name].filter(Boolean).join(' ').trim(),
      };
    });

    transactionId = prepared.transactionId;

    // Do NOT call PayPal API yet — admin must review and approve first
    await sendWithdrawalSubmittedEmail(prepared.userEmail, prepared.userName, {
      amount,
      currency: walletCurrency,
      reference: senderBatchId,
      method: 'PayPal',
    }).catch(() => {});

    // Notify all admins
    listActiveAdminEmails().then((emails) => {
      for (const email of emails) {
        sendWithdrawalAdminNotification(email, {
          userName: prepared.userName,
          userEmail: prepared.userEmail,
          amount,
          currency: walletCurrency,
          method: 'PayPal',
          reference: senderBatchId,
        }).catch(() => {});
      }
    }).catch(() => {});

    res.json({
      success: true,
      message: 'Withdrawal request submitted. An admin will review and process it shortly.',
      status: 'pending_admin_approval',
    });
  } catch (error) {
    console.error('withdrawPaypalPayout failed:', error.message);
    if (transactionId) {
      await query(
        `
          update public.wallet_transactions
          set status = 'failed',
              metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb,
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [
          transactionId,
          {
            error: error.message,
            paypalError: error?.details || error?.statusCode ? serializePaypalPayoutError(error) : undefined,
          },
        ],
      ).catch(() => {});
      await query(
        `
          update public.wallet_accounts
          set available_balance = available_balance + $2,
              updated_at = timezone('utc', now())
          where user_id = $1
        `,
        [userId, amount],
      ).catch(() => {});
    }
    const isAuthError = error?.statusCode === 401 || error?.statusCode === 403;
    res.status(error.statusCode || 500).json({
      success: false,
      message: isAuthError
        ? 'PayPal withdrawals are temporarily unavailable. Your balance has been restored. Please try again later or contact support.'
        : (error.message || 'PayPal withdrawal could not be submitted. Your balance has been restored.'),
    });
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
      paymentMethod: req.body?.paymentMethod || 'paypal',
      payerEmail: req.body?.customerEmail || req.user?.email,
    });
    const approvalUrl = approvalUrlFromOrder(order);
    if (!order?.id || !approvalUrl) {
      throw new Error('PayPal approval link was not returned.');
    }

    await query(
      `
        insert into public.paypal_payments (
          user_id, request_id, package_id, trip_id, traveler_id, paypal_order_id, status,
          amount, shipment_amount, traveler_payout, insurance_cost, currency,
          payment_method, raw_response
        )
        values ($1,$2,$3,$4,$5,$6,'created',$7,$8,$9,$10,$11,$12,$13)
        on conflict (paypal_order_id) do update
        set raw_response = excluded.raw_response,
            updated_at = timezone('utc', now())
      `,
      [
        checkout.senderId,
        checkout.targetRequestId || null,
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
        {
          ...order,
          additionalKg: checkout.additionalKg || null,
          targetRequestId: checkout.targetRequestId || null,
        },
      ],
    );
    await recordPaypalEvent({
      eventType: 'order_created',
      providerReference: order.id,
      payload: { amount: checkout.amount, currency: checkout.currency, paymentMethod: req.body?.paymentMethod || 'paypal' },
    });

    res.json({
      success: true,
      provider: 'paypal',
      orderId: order.id,
      approvalUrl,
      amount: checkout.amount,
      shipmentAmount: checkout.shipmentAmount,
      currency: checkout.currency,
      intent: 'CAPTURE',
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

export async function capturePaypalOrder(req, res) {
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

    const capture = await capturePaypalOrderApi(orderId);
    const captureInfo = capture?.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = captureInfo?.id;
    if (!captureId) {
      throw new Error('PayPal did not return a capture ID.');
    }
    const captureStatus = String(captureInfo?.status || capture?.status || 'COMPLETED').toLowerCase();

    await query(
      `
        update public.paypal_payments
        set paypal_capture_id = $2,
            status = $3,
            raw_response = raw_response || $4::jsonb,
            error_message = null,
            updated_at = timezone('utc', now())
        where paypal_order_id = $1
      `,
      [
        orderId,
        captureId,
        captureStatus === 'completed' ? 'captured' : captureStatus,
        { capture },
      ],
    );
    await recordPaypalEvent({
      eventType: 'captured',
      providerReference: orderId,
      payload: { captureId, capture },
    });

    res.json({
      success: true,
      provider: 'paypal',
      orderId,
      captureId,
      paymentReference: orderId,
      status: captureStatus === 'completed' ? 'captured' : captureStatus,
      amount: Number(payment.amount || 0),
      shipmentAmount: Number(payment.shipment_amount || 0),
      currency: payment.currency || 'USD',
    });
  } catch (error) {
    console.error('capturePaypalOrder failed:', error.message);
    if (req.body?.orderId) {
      await query(
        `
          update public.paypal_payments
          set status = 'capture_failed',
              error_message = $2,
              raw_response = raw_response || $3::jsonb,
              updated_at = timezone('utc', now())
          where paypal_order_id = $1
        `,
        [req.body.orderId.toString(), error.message, { captureError: error.details || { message: error.message } }],
      ).catch(() => {});
    }
    await recordPaypalEvent({
      eventType: 'capture_failed',
      providerReference: req.body?.orderId?.toString(),
      payload: { message: error.message },
    }).catch(() => {});
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode === 503
        ? 'PayPal checkout is not configured yet.'
        : (error.message || 'PayPal payment could not be captured. Please try again.'),
    });
  }
}

export async function authorizePaypalOrder(_req, res) {
  res.status(410).json({
    success: false,
    message: 'PayPal authorization-only checkout is disabled. Please start checkout again.',
  });
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
    await recordPaypalEvent({
      eventType: 'captured',
      providerReference: authorizationId,
      requestId,
      payload: { capture },
    });
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
    await recordPaypalEvent({
      eventType: 'capture_failed',
      providerReference: req.body?.authorizationId?.toString() || req.body?.requestId?.toString(),
      requestId: req.body?.requestId?.toString() || null,
      payload: { message: error.message },
    }).catch(() => {});
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
    await recordPaypalEvent({
      eventType: 'voided',
      providerReference: authorizationId,
      requestId,
      payload: { voided: result || true },
    });
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
    await recordPaypalEvent({
      eventType: 'void_failed',
      providerReference: req.body?.authorizationId?.toString() || req.body?.requestId?.toString(),
      requestId: req.body?.requestId?.toString() || null,
      payload: { message: error.message },
    }).catch(() => {});
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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function paypalApplePaySheet(req, res) {
  const clientId = getPaypalClientId();
  const orderId = req.query.orderId?.toString() || '';
  const amount = Number(req.query.amount || 0).toFixed(2);
  const currency = (req.query.currency?.toString() || 'USD').toUpperCase();

  if (!clientId || !orderId || Number(amount) <= 0 || !isPaypalApplePayEnabled()) {
    return res.type('html').send(`<!doctype html>
      <html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px">
        <h2>Apple Pay is not available</h2>
        <p>Please go back and use Bank Card or PayPal.</p>
      </body></html>`);
  }

  const safeOrderId = escapeHtml(orderId);
  const safeAmount = escapeHtml(amount);
  const safeCurrency = escapeHtml(currency);
  const sdkParams = new URLSearchParams({
    'client-id': clientId,
    currency,
    components: 'applepay',
  });
  const merchantId = getPaypalMerchantId();
  const buyerCountry = getPaypalBuyerCountry();
  if (merchantId) sdkParams.set('merchant-id', merchantId);
  if (buyerCountry) sdkParams.set('buyer-country', buyerCountry);

  res.type('html').send(`<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <script src="https://www.paypal.com/sdk/js?${escapeHtml(sdkParams.toString())}"></script>
        <script src="https://applepay.cdn-apple.com/jsapi/1.latest/apple-pay-sdk.js"></script>
        <style>
          body { margin:0; padding:32px 22px; font-family:-apple-system,BlinkMacSystemFont,sans-serif; background:#fff; color:#111827; }
          h1 { font-size:32px; line-height:1.05; margin:48px 0 16px; font-weight:900; }
          p { color:#6b7280; font-size:17px; line-height:1.4; }
          apple-pay-button { --apple-pay-button-width:100%; --apple-pay-button-height:56px; --apple-pay-button-border-radius:16px; margin-top:28px; }
          .error { color:#b91c1c; margin-top:18px; }
        </style>
      </head>
      <body>
        <h1>Apple Pay</h1>
        <p>Confirm ${safeCurrency} ${safeAmount} with Apple Pay. Bago will hold the payment in escrow until shipping is complete.</p>
        <div id="applepay-container"></div>
        <p id="message" class="error"></p>
        <script>
          const orderId = "${safeOrderId}";
          const amount = "${safeAmount}";
          const currency = "${safeCurrency}";
          const returnUrl = "/api/payments/paypal/return?orderId=" + encodeURIComponent(orderId);
          const cancelUrl = "/api/payments/paypal/cancel?orderId=" + encodeURIComponent(orderId);
          const message = document.getElementById("message");

          function fail(text) {
            message.textContent = text || "Apple Pay could not be started.";
          }

          async function setupApplePay() {
            if (!window.ApplePaySession || !ApplePaySession.canMakePayments()) {
              fail("Apple Pay is not available on this device or browser.");
              return;
            }
            const applepay = paypal.Applepay();
            const config = await applepay.config();
            if (!config.isEligible) {
              fail("Apple Pay is not enabled for this PayPal merchant.");
              return;
            }
            document.getElementById("applepay-container").innerHTML =
              '<apple-pay-button id="apple-pay-button" buttonstyle="black" type="pay" locale="en"></apple-pay-button>';
            document.getElementById("apple-pay-button").addEventListener("click", () => {
              const paymentRequest = {
                countryCode: config.countryCode,
                merchantCapabilities: config.merchantCapabilities,
                supportedNetworks: config.supportedNetworks,
                currencyCode: currency,
                requiredBillingContactFields: ["postalAddress"],
                total: { label: "Bago", type: "final", amount }
              };
              const session = new ApplePaySession(4, paymentRequest);
              session.onvalidatemerchant = (event) => {
                applepay.validateMerchant({ validationUrl: event.validationURL, displayName: "Bago" })
                  .then((result) => session.completeMerchantValidation(result.merchantSession))
                  .catch((error) => { session.abort(); fail("Apple Pay merchant validation failed. " + (error && error.message ? error.message : "")); });
              };
              session.onpaymentauthorized = (event) => {
                applepay.confirmOrder({
                  orderId,
                  token: event.payment.token,
                  billingContact: event.payment.billingContact,
                  shippingContact: event.payment.shippingContact
                }).then(() => {
                  session.completePayment(ApplePaySession.STATUS_SUCCESS);
                  window.location.href = returnUrl;
                }).catch((error) => {
                  session.completePayment(ApplePaySession.STATUS_FAILURE);
                  fail("Apple Pay could not confirm this payment. " + (error && error.message ? error.message : ""));
                });
              };
              session.oncancel = () => { window.location.href = cancelUrl; };
              session.begin();
            });
          }

          setupApplePay().catch(() => fail("Apple Pay could not be loaded."));
        </script>
      </body>
    </html>`);
}

export function paypalCardFieldsSheet(req, res) {
  const clientId = getPaypalClientId();
  const orderId = req.query.orderId?.toString() || '';
  const amount = Number(req.query.amount || 0).toFixed(2);
  const currency = (req.query.currency?.toString() || 'USD').toUpperCase();
  const email = req.query.email?.toString() || '';

  if (!clientId || !orderId || Number(amount) <= 0 || !isPaypalAdvancedCardsEnabled()) {
    return res.type('html').send(`<!doctype html>
      <html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:24px">
        <h2>Card payment is not available</h2>
        <p>Please go back and use PayPal checkout.</p>
      </body></html>`);
  }

  const safeClientId = encodeURIComponent(clientId);
  const safeOrderId = escapeHtml(orderId);
  const safeAmount = escapeHtml(amount);
  const safeCurrency = escapeHtml(currency);
  const safeEmail = escapeHtml(email);

  res.type('html').send(`<!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
        <script src="https://www.paypal.com/sdk/js?client-id=${safeClientId}&currency=${safeCurrency}&components=card-fields"></script>
        <style>
          * { box-sizing: border-box; }
          body { margin:0; padding:28px 22px 34px; font-family:-apple-system,BlinkMacSystemFont,sans-serif; background:#fff; color:#111827; }
          h1 { font-size:32px; line-height:1.05; margin:34px 0 10px; font-weight:900; }
          p { color:#6b7280; font-size:16px; line-height:1.4; }
          label { display:block; margin:18px 0 8px; font-weight:800; font-size:15px; color:#111827; }
          input, .field { width:100%; min-height:56px; border:1px solid #d1d5db; border-radius:16px; padding:15px 16px; background:#f9fafb; font-size:17px; }
          .row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
          button { width:100%; height:58px; border:0; border-radius:18px; background:#5b46ff; color:#fff; font-size:18px; font-weight:900; margin-top:26px; }
          button:disabled { opacity:.55; }
          .error { color:#b91c1c; margin-top:16px; min-height:22px; }
          .email { color:#111827; font-weight:700; }
        </style>
      </head>
      <body>
        <h1>Enter your card details</h1>
        <p>Pay ${safeCurrency} ${safeAmount}. Card details are processed by PayPal. Bago never receives your card number or CVV.</p>
        ${safeEmail ? `<p class="email">${safeEmail}</p>` : ''}
        <label>Cardholder name</label>
        <div id="card-name-field-container" class="field"></div>
        <label>Card number</label>
        <div id="card-number-field-container" class="field"></div>
        <div class="row">
          <div>
            <label>Expiration date</label>
            <div id="card-expiry-field-container" class="field"></div>
          </div>
          <div>
            <label>CVV</label>
            <div id="card-cvv-field-container" class="field"></div>
          </div>
        </div>
        <button id="pay-button" disabled>Pay ${safeCurrency} ${safeAmount}</button>
        <p id="message" class="error"></p>
        <script>
          const orderId = "${safeOrderId}";
          const returnUrl = "/api/payments/paypal/return?orderId=" + encodeURIComponent(orderId);
          const message = document.getElementById("message");
          const button = document.getElementById("pay-button");
          const style = {
            input: { "font-size": "17px", "font-family": "-apple-system, BlinkMacSystemFont, sans-serif", color: "#111827" },
            ".invalid": { color: "#b91c1c" }
          };
          function fail(text) { message.textContent = text || "Card payment could not be completed."; }
          async function setupCardFields() {
            const cardFields = paypal.CardFields({
              style,
              createOrder: () => orderId,
              onApprove: () => { window.location.href = returnUrl; },
              onError: (error) => fail(error && error.message ? error.message : "Card payment could not be completed.")
            });
            if (!cardFields.isEligible()) {
              fail("Card fields are not eligible for this PayPal merchant/account.");
              return;
            }
            cardFields.NameField().render("#card-name-field-container");
            cardFields.NumberField().render("#card-number-field-container");
            cardFields.ExpiryField().render("#card-expiry-field-container");
            cardFields.CVVField().render("#card-cvv-field-container");
            button.disabled = false;
            button.addEventListener("click", () => {
              button.disabled = true;
              message.textContent = "";
              cardFields.submit().catch((error) => {
                button.disabled = false;
                fail(error && error.message ? error.message : "Check your card details and try again.");
              });
            });
          }
          setupCardFields().catch((error) => fail(error && error.message ? error.message : "Card fields could not be loaded."));
        </script>
      </body>
    </html>`);
}
