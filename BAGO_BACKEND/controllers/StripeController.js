import crypto from 'crypto';
import Stripe from 'stripe';

import { query, queryOne, withTransaction } from '../lib/postgres/db.js';
import { getShipmentRequestById } from '../lib/postgres/shipping.js';
import { resend } from '../services/resendClient.js';
import { getClientIP, getLocationFromIP } from '../services/ipGeolocation.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
const PLATFORM_FEE_PERCENT = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT || 10) / 100;

function requireStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    const error = new Error('Secure payments are not configured.');
    error.statusCode = 503;
    throw error;
  }
  return stripe;
}

function userIdFromReq(req) {
  return req.user?.id || req.user?._id || req.userId;
}

function appUrl() {
  return process.env.API_PUBLIC_URL || process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'https://neringa.onrender.com';
}

function connectReturnUrl(profile) {
  return `${appUrl()}/api/payouts/connect/return?userId=${encodeURIComponent(profile.id)}`;
}

function renderConnectIncompletePage({ profile, message }) {
  const refreshUrl = `${appUrl()}/api/payouts/connect/refresh?userId=${encodeURIComponent(profile.id)}`;
  const safeMessage = String(message || 'Stripe still needs a few details before payouts can be enabled.')
    .replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    })[char]);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bago payout setup</title>
    <style>
      body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f7f7fb;color:#111827}
      main{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px}
      section{max-width:440px;background:#fff;border:1px solid #e5e7eb;border-radius:24px;padding:28px;box-shadow:0 18px 60px rgba(17,24,39,.08)}
      h1{font-size:24px;line-height:1.2;margin:0 0 12px}
      p{font-size:16px;line-height:1.5;color:#4b5563;margin:0 0 20px}
      a{display:block;text-align:center;text-decoration:none;background:#5b45ff;color:#fff;border-radius:16px;padding:15px 18px;font-weight:800}
      small{display:block;color:#6b7280;line-height:1.4;margin-top:16px}
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>Finish your payout setup</h1>
        <p>${safeMessage}</p>
        <a href="${refreshUrl}">Continue Stripe Express setup</a>
        <small>You will return to Bago only after Stripe confirms your terms, identity details, and bank account are complete.</small>
      </section>
    </main>
  </body>
</html>`;
}

function normalizeCurrency(value, fallback = 'USD') {
  return String(value || fallback).trim().toLowerCase();
}

function toMinorAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function compactObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.entries(value).reduce((acc, [key, entry]) => {
    if (entry === undefined || entry === null || entry === '') return acc;
    const compacted = compactObject(entry);
    if (compacted && typeof compacted === 'object' && !Array.isArray(compacted) && !Object.keys(compacted).length) {
      return acc;
    }
    acc[key] = compacted;
    return acc;
  }, {});
}

function countryCodeForStripe(country) {
  const value = String(country || '').trim();
  if (/^[a-z]{2}$/i.test(value)) return value.toUpperCase();
  const normalized = value.toLowerCase();
  const countries = {
    'united states': 'US',
    usa: 'US',
    'united states of america': 'US',
    'united kingdom': 'GB',
    uk: 'GB',
    england: 'GB',
    scotland: 'GB',
    wales: 'GB',
    spain: 'ES',
    france: 'FR',
    germany: 'DE',
    italy: 'IT',
    portugal: 'PT',
    ireland: 'IE',
    netherlands: 'NL',
    belgium: 'BE',
    austria: 'AT',
    canada: 'CA',
    australia: 'AU',
    nigeria: 'NG',
    ghana: 'GH',
    kenya: 'KE',
    'south africa': 'ZA',
  };
  return countries[normalized] || undefined;
}

function stripeDobFromProfile(profile) {
  const raw = profile.verified_date_of_birth || profile.date_of_birth;
  if (!raw) return undefined;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return {
    day: parsed.getUTCDate(),
    month: parsed.getUTCMonth() + 1,
    year: parsed.getUTCFullYear(),
  };
}

function stripeConnectAccountPayload(profile) {
  const country = countryCodeForStripe(profile.country);
  const firstName = profile.verified_first_name || profile.first_name;
  const lastName = profile.verified_last_name || profile.last_name;

  return compactObject({
    type: 'express',
    email: profile.email,
    country,
    business_type: 'individual',
    individual: {
      first_name: firstName,
      last_name: lastName,
      phone: profile.phone,
      email: profile.email,
      dob: stripeDobFromProfile(profile),
    },
    business_profile: {
      name: 'Bago Traveler Payouts',
      product_description: 'Peer-to-peer package delivery payouts for completed shipments.',
      url: process.env.APP_URL || process.env.FRONTEND_URL || undefined,
    },
    capabilities: { transfers: { requested: true } },
    settings: { payouts: { schedule: { interval: 'manual' } } },
    metadata: { userId: profile.id },
  });
}

function requirePayoutProfileBasics(profile) {
  const email = String(profile?.email || '').trim();
  if (!email || !email.includes('@')) {
    const error = new Error('Add a valid email to your Bago profile before setting up payouts.');
    error.statusCode = 400;
    throw error;
  }
}

function stripeConnectAccountUpdatePayload(profile) {
  return compactObject({
    business_profile: {
      name: 'Bago Traveler Payouts',
      product_description: 'Peer-to-peer package delivery payouts for completed shipments.',
      url: process.env.APP_URL || process.env.FRONTEND_URL || undefined,
    },
    settings: { payouts: { schedule: { interval: 'manual' } } },
    metadata: { userId: profile.id },
  });
}

function stripeAccountLinkType(account) {
  const due = [
    ...(account?.requirements?.currently_due || []),
    ...(account?.future_requirements?.currently_due || []),
  ];
  if (!account?.details_submitted || due.length > 0) return 'account_onboarding';
  return 'account_onboarding';
}

async function createStripeConnectAccountLink({ client, accountId, profile, type }) {
  const params = {
    account: accountId,
    refresh_url: `${appUrl()}/api/payouts/connect/refresh?userId=${encodeURIComponent(profile.id)}`,
    return_url: connectReturnUrl(profile),
    type,
  };
  if (type === 'account_onboarding') {
    params.collection_options = {
      fields: 'eventually_due',
      future_requirements: 'include',
    };
  }
  return client.accountLinks.create(params);
}

async function syncStripeConnectAccountState(account) {
  const complete = Boolean(account.details_submitted && account.payouts_enabled);
  await query(
    `
      update public.profiles
      set stripe_onboarding_complete = $2,
          stripe_onboarding_status = $3,
          stripe_charges_enabled = $4,
          stripe_payouts_enabled = $5,
          payout_provider = 'stripe',
          payout_method = 'stripe_connect',
          payout_method_status = $6,
          payout_status = $6,
          updated_at = timezone('utc', now())
      where stripe_connect_account_id = $1
    `,
    [
      account.id,
      complete,
      complete ? 'complete' : 'incomplete',
      Boolean(account.charges_enabled),
      Boolean(account.payouts_enabled),
      complete ? 'active' : 'incomplete',
    ],
  );
  return complete;
}

function buildPaymentMethodEligibility({ countryCode, currency, captureMethod = 'automatic' }) {
  const country = String(countryCode || '').trim().toUpperCase();
  const normalizedCurrency = normalizeCurrency(currency || 'USD');
  const isEur = normalizedCurrency === 'eur';
  const isManualCapture = captureMethod === 'manual';

  return {
    countryCode: country || null,
    currency: normalizedCurrency.toUpperCase(),
    captureMethod,
    methods: [
      {
        id: 'card',
        label: 'Card',
        available: true,
      },
      {
        id: 'apple_pay',
        label: 'Apple Pay',
        available: true,
        note: 'Shown only on eligible Apple Pay devices and browsers.',
      },
    ],
  };
}

export async function getStripePaymentMethods(req, res) {
  try {
    const ip = getClientIP(req);
    const location = await getLocationFromIP(ip).catch(() => null);
    const countryCode = req.query?.countryCode || location?.countryCode || location?.country || '';
    const currency = req.query?.currency || location?.currency || 'USD';
    const captureMethod = req.query?.captureMethod === 'manual' ? 'manual' : 'automatic';

    return res.json({
      success: true,
      ip,
      location,
      ...buildPaymentMethodEligibility({ countryCode, currency, captureMethod }),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

function hashOtp(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function otpMatches(storedHash, value) {
  const calculated = hashOtp(value);
  if (!storedHash || storedHash.length !== calculated.length) return false;
  return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(calculated));
}

async function ensureStripeInfrastructure() {
  await query(`
    alter table public.profiles
      add column if not exists stripe_customer_id text,
      add column if not exists default_payment_method_id text,
      add column if not exists stripe_connect_account_id text,
      add column if not exists stripe_onboarding_complete boolean not null default false,
      add column if not exists stripe_onboarding_status text,
      add column if not exists stripe_charges_enabled boolean not null default false,
      add column if not exists stripe_payouts_enabled boolean not null default false,
      add column if not exists payout_otp_hash text,
      add column if not exists payout_otp_expires_at timestamptz
  `);

  await query(`
    alter table public.shipment_requests
      add column if not exists stripe_payment_intent_id text,
      add column if not exists stripe_transfer_id text,
      add column if not exists stripe_refund_id text,
      add column if not exists payment_status text not null default 'pending',
      add column if not exists platform_fee_amount integer not null default 0,
      add column if not exists traveler_payout_amount integer not null default 0,
      add column if not exists captured_at timestamptz,
      add column if not exists cancelled_at timestamptz,
      add column if not exists refunded_at timestamptz,
      add column if not exists refund_amount integer,
      add column if not exists refund_reason text
  `);

  await query(`create index if not exists shipment_requests_stripe_payment_intent_idx on public.shipment_requests (stripe_payment_intent_id)`);

  await query(`
    create table if not exists public.payments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.profiles(id) on delete cascade,
      shipment_id uuid null references public.shipment_requests(id) on delete set null,
      package_id uuid null references public.packages(id) on delete set null,
      trip_id uuid null references public.trips(id) on delete set null,
      provider text not null default 'stripe',
      payment_method text,
      stripe_payment_intent_id text unique,
      stripe_charge_id text,
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
  await query(`
    alter table public.payments
      add column if not exists id uuid default gen_random_uuid(),
      add column if not exists user_id uuid references public.profiles(id) on delete cascade,
      add column if not exists shipment_id uuid references public.shipment_requests(id) on delete set null,
      add column if not exists package_id uuid references public.packages(id) on delete set null,
      add column if not exists trip_id uuid references public.trips(id) on delete set null,
      add column if not exists provider text not null default 'stripe',
      add column if not exists payment_method text,
      add column if not exists stripe_payment_intent_id text,
      add column if not exists stripe_charge_id text,
      add column if not exists amount numeric(14,2) not null default 0,
      add column if not exists currency text not null default 'USD',
      add column if not exists commission_amount numeric(14,2) not null default 0,
      add column if not exists traveler_amount numeric(14,2) not null default 0,
      add column if not exists status text not null default 'pending',
      add column if not exists raw_response jsonb not null default '{}'::jsonb,
      add column if not exists created_at timestamptz not null default timezone('utc', now()),
      add column if not exists updated_at timestamptz not null default timezone('utc', now())
  `);
  await query(`create unique index if not exists payments_stripe_payment_intent_id_key on public.payments (stripe_payment_intent_id)`);
  await query(`create index if not exists payments_user_status_idx on public.payments (user_id, status)`);

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
}

async function getProfile(userId) {
  await ensureStripeInfrastructure();
  return queryOne(
    `
      select p.*, wa.available_balance, wa.currency as wallet_currency
      from public.profiles p
      left join public.wallet_accounts wa on wa.user_id = p.id
      where p.id = $1
    `,
    [userId],
  );
}

async function ensureStripeCustomer(profile) {
  if (profile.stripe_customer_id) return profile.stripe_customer_id;
  const client = requireStripe();
  const customer = await client.customers.create({
    email: profile.email || undefined,
    name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || undefined,
    phone: profile.phone || undefined,
    metadata: { userId: profile.id },
  });
  await query(
    `update public.profiles set stripe_customer_id = $2, payment_gateway = 'stripe', updated_at = timezone('utc', now()) where id = $1`,
    [profile.id, customer.id],
  );
  return customer.id;
}

async function createEphemeralKey(customerId) {
  return requireStripe().ephemeralKeys.create(
    { customer: customerId },
    { apiVersion: '2024-06-20' },
  );
}

function serializeCard(pm, defaultPaymentMethodId) {
  return {
    id: pm.id,
    brand: pm.card?.brand,
    last4: pm.card?.last4,
    expMonth: pm.card?.exp_month,
    expYear: pm.card?.exp_year,
    isDefault: pm.id === defaultPaymentMethodId,
  };
}

export async function getStripePayoutStatus(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile?.stripe_connect_account_id) {
      return res.json({ success: true, status: 'not_setup' });
    }
    const client = requireStripe();
    const account = await client.accounts.retrieve(profile.stripe_connect_account_id);
    const complete = await syncStripeConnectAccountState(account);
    if (!complete) return res.json({ success: true, status: 'incomplete' });

    const balance = await client.balance.retrieve({
      stripeAccount: profile.stripe_connect_account_id,
    });

    return res.json({
      success: true,
      status: 'active',
      available: balance.available.map(({ amount, currency }) => ({ amount, currency })),
      pending: balance.pending.map(({ amount, currency }) => ({ amount, currency })),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function startStripeConnectOnboarding(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile) return res.status(404).json({ success: false, message: 'User not found.' });
    requirePayoutProfileBasics(profile);

    const client = requireStripe();
    let accountId = profile.stripe_connect_account_id;
    let account;
    if (!accountId) {
      account = await client.accounts.create(stripeConnectAccountPayload(profile));
      accountId = account.id;
      await query(
        `
          update public.profiles
          set stripe_connect_account_id = $2,
              stripe_onboarding_complete = false,
              stripe_onboarding_status = 'incomplete',
              payout_provider = 'stripe',
              payout_method = 'stripe_connect',
              payout_method_status = 'incomplete',
              payment_gateway = 'stripe',
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [profile.id, accountId],
      );
    } else {
      account = await client.accounts.retrieve(accountId);
      await syncStripeConnectAccountState(account);
    }

    if (account?.details_submitted && account?.payouts_enabled) {
      return res.json({
        success: true,
        status: 'active',
        message: 'Your payout account is already ready.',
      });
    }

    const accountLink = await createStripeConnectAccountLink({
      client,
      accountId,
      profile,
      type: 'account_onboarding',
    });

    return res.json({ success: true, url: accountLink.url });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Payout setup could not be started. Please try again.',
    });
  }
}

export async function createStripeConnectAccountSession(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile) return res.status(404).json({ success: false, message: 'User not found.' });
    requirePayoutProfileBasics(profile);

    const client = requireStripe();
    let accountId = profile.stripe_connect_account_id;
    let account;
    if (!accountId) {
      account = await client.accounts.create(stripeConnectAccountPayload(profile));
      accountId = account.id;
      await query(
        `
          update public.profiles
          set stripe_connect_account_id = $2,
              stripe_onboarding_complete = false,
              stripe_onboarding_status = 'incomplete',
              payout_provider = 'stripe',
              payout_method = 'stripe_connect',
              payout_method_status = 'incomplete',
              payment_gateway = 'stripe',
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [profile.id, accountId],
      );
    } else {
      account = await client.accounts.retrieve(accountId);
      await syncStripeConnectAccountState(account);
    }

    let accountSession;
    try {
      accountSession = await client.accountSessions.create({
        account: accountId,
        components: {
          account_onboarding: {
            enabled: true,
            features: {
              disable_stripe_user_authentication: true,
            },
          },
        },
      });
    } catch (sessionError) {
      accountSession = await client.accountSessions.create({
        account: accountId,
        components: {
          account_onboarding: {
            enabled: true,
          },
        },
      });
    }

    return res.json({
      success: true,
      accountId,
      clientSecret: accountSession.client_secret,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Payout setup could not be started. Please try again.',
    });
  }
}

export async function stripeConnectReturn(req, res) {
  try {
    const profile = await getProfile(req.query.userId);
    if (!profile?.stripe_connect_account_id) {
      return res.status(404).send('Payout account not found.');
    }
    const client = requireStripe();
    const account = await client.accounts.retrieve(profile.stripe_connect_account_id);
    const complete = await syncStripeConnectAccountState(account);
    if (complete) {
      return res.redirect('bago://payouts/setup-complete?status=complete');
    }
    return res
      .status(200)
      .type('html')
      .send(renderConnectIncompletePage({
        profile,
        message: 'Your Stripe Express account is not complete yet. Please continue to accept Stripe terms, confirm your identity, and add your bank account.',
      }));
  } catch (error) {
    return res.status(error.statusCode || 500).send(error.message);
  }
}

export async function stripeConnectRefresh(req, res) {
  try {
    const profile = await getProfile(req.query.userId);
    if (!profile?.stripe_connect_account_id) return res.status(404).send('Payout account not found.');
    const client = requireStripe();
    const account = await client.accounts.retrieve(profile.stripe_connect_account_id);
    const complete = await syncStripeConnectAccountState(account);
    if (complete) {
      return res.redirect('bago://payouts/setup-complete?status=complete');
    }
    const accountLink = await createStripeConnectAccountLink({
      client,
      accountId: profile.stripe_connect_account_id,
      profile,
      type: 'account_onboarding',
    });
    return res.redirect(accountLink.url);
  } catch (error) {
    return res.status(error.statusCode || 500).send(error.message);
  }
}

export async function stripeConnectWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    event = requireStripe().webhooks.constructEvent(req.rawBody || req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    await ensureStripeInfrastructure();
    if (event.type === 'account.updated') {
      const account = event.data.object;
      await syncStripeConnectAccountState(account);
    }
    if (
      event.type === 'payment_intent.succeeded' ||
      event.type === 'payment_intent.payment_failed' ||
      event.type === 'payment_intent.processing'
    ) {
      const paymentIntent = event.data.object;
      const status =
        event.type === 'payment_intent.succeeded'
          ? 'succeeded'
          : event.type === 'payment_intent.processing'
            ? 'processing'
            : 'failed';
      await query(
        `
          insert into public.payments (
            user_id, shipment_id, provider, payment_method, stripe_payment_intent_id,
            amount, currency, status, raw_response
          )
          values (
            null,
            null,
            'stripe',
            coalesce($5, 'stripe'),
            $1,
            $2,
            $3,
            $4,
            $6
          )
          on conflict (stripe_payment_intent_id) do update
          set status = excluded.status,
              raw_response = public.payments.raw_response || excluded.raw_response,
              updated_at = timezone('utc', now())
        `,
        [
          paymentIntent.id,
          (paymentIntent.amount || 0) / 100,
          String(paymentIntent.currency || '').toUpperCase(),
          status,
          paymentIntent.metadata?.paymentMethodType || paymentIntent.payment_method_types?.[0],
          { webhookEventId: event.id, paymentIntent },
        ],
      ).catch((err) => {
        console.error('Stripe webhook payment upsert failed:', err.message);
      });

      await query(
        `
          update public.shipment_requests
          set payment_status = $2,
              payment_info = coalesce(payment_info, '{}'::jsonb) || $3::jsonb,
              updated_at = timezone('utc', now())
          where stripe_payment_intent_id = $1
        `,
        [
          paymentIntent.id,
          status === 'succeeded' ? 'paid_escrow' : status,
          { stripeWebhookStatus: status, webhookEventId: event.id },
        ],
      ).catch((err) => {
        console.error('Stripe webhook shipment update failed:', err.message);
      });
    }

    await query(
      `
        insert into public.payment_events (provider, event_type, provider_reference, payload)
        values ('stripe', $1, $2, $3)
        on conflict (provider, event_type, provider_reference) do nothing
      `,
      [event.type, event.id, { event }],
    ).catch(() => {});

    return res.json({ received: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createStripeDashboardLink(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile?.stripe_connect_account_id) {
      return res.status(400).json({ success: false, message: 'Payout account not set up.' });
    }
    requirePayoutProfileBasics(profile);
    const client = requireStripe();
    const account = await client.accounts.retrieve(profile.stripe_connect_account_id);
    const complete = await syncStripeConnectAccountState(account);
    if (complete) {
      return res.json({
        success: true,
        status: 'active',
        message: 'Your payout account is already ready.',
      });
    }
    const accountLink = await createStripeConnectAccountLink({
      client,
      accountId: profile.stripe_connect_account_id,
      profile,
      type: 'account_onboarding',
    });
    return res.json({ success: true, url: accountLink.url, requiresCompletion: !complete });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Payout setup could not be opened. Please try again.',
    });
  }
}

export async function requestPayoutMethodOtp(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile) return res.status(404).json({ success: false, message: 'User not found.' });
    if (!resend) return res.status(503).json({ success: false, message: 'Email service is not configured.' });

    const otp = String(crypto.randomInt(100000, 1000000));
    await query(
      `
        update public.profiles
        set payout_otp_hash = $2,
            payout_otp_expires_at = timezone('utc', now()) + interval '10 minutes',
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [profile.id, hashOtp(otp)],
    );
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Bago <no-reply@bago.app>',
      to: profile.email,
      subject: 'Your Bago payout code',
      html: `<p>Your Bago payout code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
    });
    return res.json({ success: true, destination: `${String(profile.email).slice(0, 2)}***@${String(profile.email).split('@')[1]}` });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function verifyPayoutMethodOtp(req, res) {
  try {
    const otp = String(req.body?.otp || '').trim();
    const profile = await getProfile(userIdFromReq(req));
    if (!profile?.payout_otp_hash || !profile.payout_otp_expires_at || new Date(profile.payout_otp_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested.' });
    }
    if (!otpMatches(profile.payout_otp_hash, otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP.' });
    }
    await query(
      `update public.profiles set payout_otp_hash = null, payout_otp_expires_at = null, updated_at = timezone('utc', now()) where id = $1`,
      [profile.id],
    );
    if (!profile?.stripe_connect_account_id) {
      return res.status(400).json({ success: false, message: 'Payout account not set up.' });
    }
    const client = requireStripe();
    const account = await client.accounts.retrieve(profile.stripe_connect_account_id);
    const accountLink = await createStripeConnectAccountLink({
      client,
      accountId: profile.stripe_connect_account_id,
      profile,
      type: stripeAccountLinkType(account),
    });
    return res.json({ success: true, url: accountLink.url });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function createStripeCustomer(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile) return res.status(404).json({ success: false, message: 'User not found.' });
    const customerId = await ensureStripeCustomer(profile);
    return res.json({ success: true, customerId });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function createCardSetupIntent(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile) return res.status(404).json({ success: false, message: 'User not found.' });
    const customerId = await ensureStripeCustomer(profile);
    const ephemeralKey = await createEphemeralKey(customerId);
    const setupIntent = await requireStripe().setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });
    return res.json({
      success: true,
      clientSecret: setupIntent.client_secret,
      client_secret: setupIntent.client_secret,
      setupIntentClientSecret: setupIntent.client_secret,
      setup_intent_client_secret: setupIntent.client_secret,
      customerId,
      customer_id: customerId,
      customer: customerId,
      ephemeralKeySecret: ephemeralKey.secret,
      ephemeral_key_secret: ephemeralKey.secret,
      customerEphemeralKeySecret: ephemeralKey.secret,
      customer_ephemeral_key_secret: ephemeralKey.secret,
      setupIntent: {
        id: setupIntent.id,
        clientSecret: setupIntent.client_secret,
        client_secret: setupIntent.client_secret,
      },
      ephemeralKey: {
        id: ephemeralKey.id,
        secret: ephemeralKey.secret,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function listSavedCards(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile?.stripe_customer_id) return res.json({ success: true, cards: [] });
    const paymentMethods = await requireStripe().paymentMethods.list({
      customer: profile.stripe_customer_id,
      type: 'card',
    });
    return res.json({
      success: true,
      cards: paymentMethods.data.map((pm) => serializeCard(pm, profile.default_payment_method_id)),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function setDefaultCard(req, res) {
  try {
    const paymentMethodId = String(req.body?.paymentMethodId || '').trim();
    const profile = await getProfile(userIdFromReq(req));
    if (!profile?.stripe_customer_id) return res.status(400).json({ success: false, message: 'Payment customer not found.' });
    await requireStripe().customers.update(profile.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    await query(
      `update public.profiles set default_payment_method_id = $2, updated_at = timezone('utc', now()) where id = $1`,
      [profile.id, paymentMethodId],
    );
    return res.json({ success: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function deleteSavedCard(req, res) {
  try {
    const paymentMethodId = String(req.params.paymentMethodId || '').trim();
    const profile = await getProfile(userIdFromReq(req));
    await requireStripe().paymentMethods.detach(paymentMethodId);
    if (profile?.default_payment_method_id === paymentMethodId) {
      await query(
        `update public.profiles set default_payment_method_id = null, updated_at = timezone('utc', now()) where id = $1`,
        [profile.id],
      );
    }
    return res.json({ success: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function createStripePaymentIntent(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile) return res.status(404).json({ success: false, message: 'User not found.' });

    const amount = toMinorAmount(req.body?.amount);
    const currency = normalizeCurrency(req.body?.currency || profile.wallet_currency);
    const shipmentId = req.body?.shipmentId || req.body?.deliveryId || null;
    const packageId = req.body?.packageId || null;
    const tripId = req.body?.tripId || null;
    const travelerId = req.body?.travelerId || null;
    const paymentMethodId = req.body?.paymentMethodId || null;
    const paymentMethodType = req.body?.paymentMethodType || 'card';
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });

    if (packageId || tripId || travelerId) {
      if (!packageId || !tripId || !travelerId) {
        return res.status(400).json({ success: false, message: 'Package, trip, and traveler are required before payment.' });
      }
      if (req.body?.termsAccepted !== true) {
        return res.status(400).json({ success: false, message: 'Shipment terms must be accepted before payment.' });
      }
      if (profile.phone_verified === false) {
        return res.status(403).json({ success: false, code: 'PHONE_NOT_VERIFIED', message: 'Please verify your mobile number before payment.' });
      }
      const packageRow = await queryOne(
        `select id, category from public.packages where id = $1 and user_id = $2 limit 1`,
        [packageId, profile.id],
      );
      if (!packageRow) {
        return res.status(404).json({ success: false, message: 'Package not found or not owned by sender.' });
      }
      if (packageRow.category) {
        const category = await queryOne(
          `select id, name, slug, risk_level from public.item_categories where slug = $1 and is_active = true limit 1`,
          [packageRow.category],
        ).catch(() => null);
        if (category?.risk_level === 'prohibited') {
          return res.status(403).json({
            success: false,
            code: 'PROHIBITED_ITEM',
            message: `"${category.name}" is a prohibited item on Bago. Shipment cannot be created.`,
          });
        }
      }
      const tripRow = await queryOne(
        `select id from public.trips where id = $1 and user_id = $2 limit 1`,
        [tripId, travelerId],
      );
      if (!tripRow) {
        return res.status(404).json({ success: false, message: 'Trip not found or not owned by traveler.' });
      }
    }

    const customerId = await ensureStripeCustomer(profile);
    const ephemeralKey = await createEphemeralKey(customerId);
    const ip = getClientIP(req);
    const location = await getLocationFromIP(ip).catch(() => null);
    const detectedCountry = location?.countryCode || location?.country || '';
    const paymentMethodEligibility = buildPaymentMethodEligibility({
      countryCode: detectedCountry || req.body?.countryCode || profile.country || '',
      currency,
      captureMethod: 'automatic',
    });
    const bizumAvailable = paymentMethodEligibility.methods.some(
      (method) => method.id === 'bizum' && method.available,
    );
    const requestedPaymentMethod = String(paymentMethodType || 'card').trim().toLowerCase();
    const paymentMethodTypes =
      requestedPaymentMethod === 'bizum' && bizumAvailable ? ['bizum'] : null;
    const params = {
      amount,
      currency,
      customer: customerId,
      metadata: {
        shipmentId: shipmentId || '',
        senderId: profile.id,
        packageId: packageId || '',
        tripId: tripId || '',
        travelerId: travelerId || '',
        paymentMethodType: paymentMethodTypes?.[0] || 'card',
      },
    };
    if (paymentMethodTypes) {
      params.payment_method_types = paymentMethodTypes;
    } else {
      params.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'never',
      };
    }
    if (paymentMethodId) {
      params.payment_method = paymentMethodId;
      params.confirm = true;
      params.off_session = false;
    }

    const paymentIntent = await requireStripe().paymentIntents.create(params);
    if (shipmentId) {
      await query(
        `
          update public.shipment_requests
          set stripe_payment_intent_id = $2,
              payment_status = 'paid_escrow',
              payment_info = coalesce(payment_info, '{}'::jsonb) || $3::jsonb,
              updated_at = timezone('utc', now())
          where id = $1 and sender_id = $4
        `,
        [
          shipmentId,
          paymentIntent.id,
          {
            method: 'stripe',
            gateway: 'stripe',
            status: paymentIntent.status,
            requestId: paymentIntent.id,
            paymentIntentId: paymentIntent.id,
          },
          profile.id,
        ],
      );
    }

    await query(
      `
        insert into public.payments (
          user_id, shipment_id, provider, payment_method, stripe_payment_intent_id,
          amount, currency, status, raw_response
        )
        values ($1,$2,'stripe',$3,$4,$5,$6,$7,$8)
        on conflict (stripe_payment_intent_id) do update
        set status = excluded.status,
            raw_response = public.payments.raw_response || excluded.raw_response,
            updated_at = timezone('utc', now())
      `,
      [
        profile.id,
        shipmentId,
        paymentMethodId ? 'saved_card' : 'payment_sheet',
        paymentIntent.id,
        amount / 100,
        currency.toUpperCase(),
        paymentIntent.status,
        { paymentIntent },
      ],
    );

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      customerId,
      ephemeralKeySecret: ephemeralKey.secret,
      paymentMethodEligibility,
    });
  } catch (error) {
    console.error('createStripePaymentIntent failed:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Secure checkout could not be started. Please try again.',
    });
  }
}

export async function createBizumCheckoutSession(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const amount = toMinorAmount(req.body?.amount);
    const currency = normalizeCurrency(req.body?.currency || 'EUR');
    const packageId = req.body?.packageId || null;
    const tripId = req.body?.tripId || null;
    const travelerId = req.body?.travelerId || null;

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });
    }
    if (currency !== 'eur') {
      return res.status(400).json({ success: false, message: 'Bizum is only available for EUR payments.' });
    }
    if (!packageId || !tripId || !travelerId) {
      return res.status(400).json({ success: false, message: 'Package, trip, and traveler are required before payment.' });
    }
    if (req.body?.termsAccepted !== true) {
      return res.status(400).json({ success: false, message: 'Shipment terms must be accepted before payment.' });
    }
    if (profile.phone_verified === false) {
      return res.status(403).json({ success: false, code: 'PHONE_NOT_VERIFIED', message: 'Please verify your mobile number before payment.' });
    }

    const packageRow = await queryOne(
      `select id, category from public.packages where id = $1 and user_id = $2 limit 1`,
      [packageId, profile.id],
    );
    if (!packageRow) {
      return res.status(404).json({ success: false, message: 'Package not found or not owned by sender.' });
    }

    const tripRow = await queryOne(
      `select id from public.trips where id = $1 and user_id = $2 limit 1`,
      [tripId, travelerId],
    );
    if (!tripRow) {
      return res.status(404).json({ success: false, message: 'Trip not found or not owned by traveler.' });
    }

    const customerId = await ensureStripeCustomer(profile);
    const baseUrl = appUrl();
    const session = await requireStripe().checkout.sessions.create({
      mode: 'payment',
      customer: customerId,
      payment_method_types: ['bizum'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount,
            product_data: { name: 'Bago shipment payment' },
          },
        },
      ],
      payment_intent_data: {
        metadata: {
          senderId: profile.id,
          packageId,
          tripId,
          travelerId,
          paymentMethodType: 'bizum',
        },
      },
      success_url: `${baseUrl}/api/payments/bizum-return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/api/payments/bizum-cancel?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        senderId: profile.id,
        packageId,
        tripId,
        travelerId,
      },
      expand: ['payment_intent'],
    });

    const paymentIntent = session.payment_intent;
    await query(
      `
        insert into public.payments (
          user_id, shipment_id, provider, payment_method, stripe_payment_intent_id,
          amount, currency, status, raw_response
        )
        values ($1,null,'stripe','bizum',$2,$3,$4,$5,$6)
        on conflict (stripe_payment_intent_id) do update
        set status = excluded.status,
            raw_response = public.payments.raw_response || excluded.raw_response,
            updated_at = timezone('utc', now())
      `,
      [
        profile.id,
        paymentIntent?.id || session.id,
        amount / 100,
        currency.toUpperCase(),
        paymentIntent?.status || session.payment_status || 'created',
        { checkoutSessionId: session.id, paymentIntentId: paymentIntent?.id || null },
      ],
    );

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
      paymentIntentId: paymentIntent?.id || '',
    });
  } catch (error) {
    console.error('createBizumCheckoutSession failed:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Bizum checkout could not be started. Please try again.',
    });
  }
}

export async function getBizumCheckoutSession(req, res) {
  try {
    const profile = await getProfile(userIdFromReq(req));
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const sessionId = String(req.params.sessionId || '').trim();
    if (!sessionId || !sessionId.startsWith('cs_')) {
      return res.status(400).json({ success: false, message: 'Invalid Bizum session.' });
    }

    const session = await requireStripe().checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });
    if (session.metadata?.senderId && session.metadata.senderId !== profile.id) {
      return res.status(403).json({ success: false, message: 'This payment session is not available.' });
    }

    const paymentIntent = session.payment_intent;
    const paymentIntentId = typeof paymentIntent === 'string'
      ? paymentIntent
      : paymentIntent?.id || '';
    const intentStatus = typeof paymentIntent === 'string'
      ? null
      : paymentIntent?.status || null;
    const status = intentStatus || session.payment_status || session.status || 'open';

    if (paymentIntentId) {
      await query(
        `
          update public.payments
          set status = $3,
              raw_response = raw_response || $4::jsonb,
              updated_at = timezone('utc', now())
          where stripe_payment_intent_id = $1
            and user_id = $2
        `,
        [
          paymentIntentId,
          profile.id,
          status,
          { checkoutSessionId: session.id, checkoutStatus: session.status, paymentStatus: session.payment_status },
        ],
      ).catch((err) => {
        console.warn('Bizum session status update failed:', err.message);
      });
    }

    return res.json({
      success: true,
      sessionId: session.id,
      checkoutStatus: session.status,
      paymentStatus: session.payment_status,
      paymentIntentId,
      status,
    });
  } catch (error) {
    console.error('getBizumCheckoutSession failed:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: 'Bizum payment could not be verified. Please try again.',
    });
  }
}

export async function captureStripeEscrow(req, res) {
  try {
    const shipmentId = req.body?.shipmentId || req.body?.deliveryId;
    const senderId = userIdFromReq(req);
    const result = await withTransaction(async (client) => {
      const locked = await client.query(
        `
          select sr.*, traveler.stripe_connect_account_id
          from public.shipment_requests sr
          join public.profiles traveler on traveler.id = sr.traveler_id
          where sr.id = $1
          for update of sr
        `,
        [shipmentId],
      );
      const request = locked.rows[0];
      if (!request) {
        const error = new Error('Shipment not found.');
        error.statusCode = 404;
        throw error;
      }
      if (request.sender_id !== senderId) {
        const error = new Error('Only the sender can capture this payment.');
        error.statusCode = 403;
        throw error;
      }
      if (!request.stripe_payment_intent_id) {
        const error = new Error('No payment record found for this shipment.');
        error.statusCode = 400;
        throw error;
      }
      if (['released', 'captured'].includes(request.payment_status)) {
        const error = new Error('Payment already released.');
        error.statusCode = 400;
        throw error;
      }
      if (!request.stripe_connect_account_id) {
        const error = new Error('Traveler payout account is not set up.');
        error.statusCode = 400;
        throw error;
      }

      let paymentIntent = await requireStripe().paymentIntents.retrieve(request.stripe_payment_intent_id);
      if (paymentIntent.status === 'requires_capture') {
        paymentIntent = await requireStripe().paymentIntents.capture(request.stripe_payment_intent_id);
      }
      if (!['succeeded', 'requires_capture'].includes(paymentIntent.status) && !paymentIntent.amount_received) {
        const error = new Error(`Payment is not ready to release. Current status: ${paymentIntent.status}.`);
        error.statusCode = 400;
        throw error;
      }
      const totalAmount = paymentIntent.amount_received || paymentIntent.amount;
      const platformFee = Math.round(totalAmount * PLATFORM_FEE_PERCENT);
      const travelerAmount = Math.max(0, totalAmount - platformFee);
      const transfer = await requireStripe().transfers.create({
        amount: travelerAmount,
        currency: paymentIntent.currency,
        destination: request.stripe_connect_account_id,
        transfer_group: shipmentId,
        metadata: { shipmentId, platformFee: String(platformFee) },
      });

      await client.query(
        `
          update public.shipment_requests
          set payment_status = 'released',
              stripe_transfer_id = $2,
              platform_fee_amount = $3,
              traveler_payout_amount = $4,
              captured_at = timezone('utc', now()),
              payment_info = coalesce(payment_info, '{}'::jsonb) || $5::jsonb,
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [
          shipmentId,
          transfer.id,
          platformFee,
          travelerAmount,
          {
            method: 'stripe',
            gateway: 'stripe',
            status: 'released',
            paymentIntentId: paymentIntent.id,
            transferId: transfer.id,
          },
        ],
      );
      await client.query(
        `
          update public.payments
          set stripe_charge_id = $2,
              status = 'released',
              commission_amount = $3,
              traveler_amount = $4,
              raw_response = raw_response || $5::jsonb,
              updated_at = timezone('utc', now())
          where stripe_payment_intent_id = $1
        `,
        [paymentIntent.id, paymentIntent.latest_charge, platformFee / 100, travelerAmount / 100, { paymentIntent, transfer }],
      );

      return { paymentIntent, transfer, totalAmount, platformFee, travelerAmount };
    });

    return res.json({
      success: true,
      captured: result.totalAmount,
      travelerPayout: result.travelerAmount,
      platformFee: result.platformFee,
      transferId: result.transfer.id,
      data: await getShipmentRequestById(shipmentId),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function cancelStripeEscrow(req, res) {
  try {
    const shipmentId = req.body?.shipmentId || req.body?.deliveryId;
    const senderId = userIdFromReq(req);
    const request = await queryOne(`select * from public.shipment_requests where id = $1`, [shipmentId]);
    if (!request) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    if (request.sender_id !== senderId) return res.status(403).json({ success: false, message: 'Only the sender can cancel this payment.' });
    if (!request.stripe_payment_intent_id) return res.status(400).json({ success: false, message: 'No payment record found.' });
    if (['released', 'captured'].includes(request.payment_status)) {
      return res.status(400).json({ success: false, message: 'Payment already released. Use the refund endpoint instead.' });
    }

    const paymentIntent = await requireStripe().paymentIntents.retrieve(request.stripe_payment_intent_id);
    let refund = null;
    if (paymentIntent.status === 'requires_capture') {
      await requireStripe().paymentIntents.cancel(request.stripe_payment_intent_id);
    } else {
      refund = await requireStripe().refunds.create({
        payment_intent: paymentIntent.id,
        reason: 'requested_by_customer',
        metadata: { shipmentId, refundReason: 'cancelled_before_release' },
      });
    }
    await query(
      `
        update public.shipment_requests
        set payment_status = $3,
            cancelled_at = timezone('utc', now()),
            payment_info = coalesce(payment_info, '{}'::jsonb) || $2::jsonb,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [
        shipmentId,
        { method: 'stripe', gateway: 'stripe', status: refund ? 'refunded' : 'cancelled', refundId: refund?.id },
        refund ? 'refunded' : 'cancelled',
      ],
    );
    return res.json({ success: true, message: refund ? 'Payment refunded.' : 'Authorization released.', refundId: refund?.id });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function issueStripeRefund(req, res) {
  try {
    const shipmentId = req.body?.shipmentId || req.body?.deliveryId;
    const type = String(req.body?.type || 'full').toLowerCase();
    const reason = String(req.body?.reason || 'requested_by_customer').toLowerCase();
    const partialAmount = req.body?.partialAmount ? toMinorAmount(req.body.partialAmount) : null;
    const senderId = userIdFromReq(req);

    const request = await queryOne(`select * from public.shipment_requests where id = $1`, [shipmentId]);
    if (!request) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    if (request.sender_id !== senderId) return res.status(403).json({ success: false, message: 'Only the sender can request this refund.' });
    if (!request.stripe_payment_intent_id) return res.status(400).json({ success: false, message: 'No payment found for this shipment.' });

    if (request.payment_status === 'authorized') {
      await requireStripe().paymentIntents.cancel(request.stripe_payment_intent_id);
      await query(
        `
          update public.shipment_requests
          set payment_status = 'refunded',
              refund_reason = $2,
              refunded_at = timezone('utc', now()),
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [shipmentId, reason],
      );
      return res.json({ success: true, method: 'authorization_cancelled' });
    }

    if (!['paid_escrow', 'processing_escrow', 'released', 'captured'].includes(request.payment_status)) {
      return res.status(400).json({ success: false, message: 'Payment is not in a refundable state.' });
    }

    const paymentIntent = await requireStripe().paymentIntents.retrieve(request.stripe_payment_intent_id);
    if (paymentIntent.status === 'requires_capture') {
      await requireStripe().paymentIntents.cancel(paymentIntent.id);
      await query(
        `
          update public.shipment_requests
          set payment_status = 'refunded',
              refund_reason = $2,
              refunded_at = timezone('utc', now()),
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [shipmentId, reason],
      );
      return res.json({ success: true, method: 'authorization_cancelled' });
    }
    const refundAmount = type === 'full' ? paymentIntent.amount_received : partialAmount;
    if (!refundAmount || refundAmount <= 0) return res.status(400).json({ success: false, message: 'Refund amount is invalid.' });
    const refund = await requireStripe().refunds.create({
      payment_intent: paymentIntent.id,
      amount: refundAmount,
      reason: reason === 'dispute' ? 'requested_by_customer' : 'requested_by_customer',
      metadata: { shipmentId, refundReason: reason },
    });

    if (request.stripe_transfer_id) {
      const reversalAmount = type === 'full'
        ? request.traveler_payout_amount
        : Math.round(refundAmount * (1 - PLATFORM_FEE_PERCENT));
      if (reversalAmount > 0) {
        await requireStripe().transfers.createReversal(request.stripe_transfer_id, {
          amount: reversalAmount,
          metadata: { shipmentId, reason },
        });
      }
    }

    await query(
      `
        update public.shipment_requests
        set payment_status = 'refunded',
            stripe_refund_id = $2,
            refund_amount = $3,
            refund_reason = $4,
            refunded_at = timezone('utc', now()),
            payment_info = coalesce(payment_info, '{}'::jsonb) || $5::jsonb,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [shipmentId, refund.id, refundAmount, reason, { method: 'stripe', gateway: 'stripe', status: 'refunded', refundId: refund.id }],
    );

    return res.json({ success: true, refundId: refund.id, refundAmount, method: 'refunded_to_original_payment' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function getStripeRefundStatus(req, res) {
  try {
    const row = await queryOne(
      `
        select payment_status, stripe_refund_id, refund_amount, refund_reason, refunded_at
        from public.shipment_requests
        where id = $1 and (sender_id = $2 or traveler_id = $2)
      `,
      [req.params.shipmentId || req.params.deliveryId, userIdFromReq(req)],
    );
    if (!row) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    return res.json({
      success: true,
      paymentStatus: row.payment_status,
      refundId: row.stripe_refund_id,
      refundAmount: row.refund_amount,
      refundReason: row.refund_reason,
      refundedAt: row.refunded_at,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}

export async function createStripePayout(req, res) {
  let transfer = null;
  let withdrawalTransactionId = null;
  const userId = userIdFromReq(req);
  try {
    const profile = await getProfile(userId);
    const amount = toMinorAmount(req.body?.amount);
    const currency = normalizeCurrency(req.body?.currency || profile?.wallet_currency);
    if (!profile?.stripe_connect_account_id || !profile.stripe_onboarding_complete) {
      return res.status(400).json({ success: false, message: 'Set up payouts before withdrawing.' });
    }
    if (amount <= 0) return res.status(400).json({ success: false, message: 'Amount must be greater than zero.' });

    const majorAmount = Number((amount / 100).toFixed(2));
    const walletCurrency = normalizeCurrency(profile.wallet_currency || currency).toUpperCase();
    if (walletCurrency !== currency.toUpperCase()) {
      return res.status(400).json({ success: false, message: `Withdraw in your wallet currency (${walletCurrency}).` });
    }

    const withdrawal = await withTransaction(async (client) => {
      const walletResult = await client.query(
        `select id, available_balance, currency from public.wallet_accounts where user_id = $1 for update`,
        [userId],
      );
      const wallet = walletResult.rows[0];
      if (!wallet) {
        const error = new Error('Wallet not found.');
        error.statusCode = 404;
        throw error;
      }
      if (Number(wallet.available_balance || 0) < majorAmount) {
        const error = new Error('Insufficient balance.');
        error.statusCode = 400;
        throw error;
      }

      await client.query(
        `update public.wallet_accounts set available_balance = available_balance - $2, updated_at = timezone('utc', now()) where user_id = $1`,
        [userId, majorAmount],
      );
      const tx = await client.query(
        `
          insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, description, metadata)
          values ($1, $2, 'withdrawal', $3, $4, 'pending', $5, $6)
          returning id
        `,
        [
          wallet.id,
          userId,
          majorAmount,
          currency.toUpperCase(),
          'Stripe Express withdrawal',
          { provider: 'stripe', stripeAccountId: profile.stripe_connect_account_id },
        ],
      );
      return { transactionId: tx.rows[0].id };
    });
    withdrawalTransactionId = withdrawal.transactionId;

    transfer = await requireStripe().transfers.create({
      amount,
      currency,
      destination: profile.stripe_connect_account_id,
      metadata: { userId: profile.id, withdrawalTransactionId },
    });

    const payout = await requireStripe().payouts.create(
      {
        amount,
        currency,
        metadata: { userId: profile.id, withdrawalTransactionId, transferId: transfer.id },
      },
      { stripeAccount: profile.stripe_connect_account_id },
    );

    await query(
      `
        update public.wallet_transactions
        set status = 'completed',
            metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb
        where id = $1
      `,
      [
        withdrawalTransactionId,
        {
          provider: 'stripe',
          stripeAccountId: profile.stripe_connect_account_id,
          stripeTransferId: transfer.id,
          stripePayoutId: payout.id,
          stripePayoutStatus: payout.status,
        },
      ],
    );

    return res.json({ success: true, payoutId: payout.id, transferId: transfer.id, status: payout.status });
  } catch (error) {
    if (transfer?.id) {
      await requireStripe().transfers.createReversal(transfer.id).catch((reverseError) => {
        console.error('Stripe withdrawal transfer reversal failed:', reverseError.message);
      });
    }
    if (withdrawalTransactionId) {
      await withTransaction(async (client) => {
        const txResult = await client.query(
          `select user_id, amount from public.wallet_transactions where id = $1 and status = 'pending' for update`,
          [withdrawalTransactionId],
        );
        const tx = txResult.rows[0];
        if (!tx) return;
        await client.query(
          `update public.wallet_accounts set available_balance = available_balance + $2, updated_at = timezone('utc', now()) where user_id = $1`,
          [tx.user_id, tx.amount],
        );
        await client.query(
          `
            update public.wallet_transactions
            set status = 'failed',
                description = 'Stripe Express withdrawal failed',
                metadata = coalesce(metadata, '{}'::jsonb) || $2::jsonb
            where id = $1
          `,
          [withdrawalTransactionId, { failureReason: error.message }],
        );
      }).catch((refundError) => {
        console.error('Stripe withdrawal wallet refund failed:', refundError.message);
      });
    }
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
}
