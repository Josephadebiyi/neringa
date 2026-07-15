import { query, queryOne, withTransaction } from './db.js';

// public.payments and public.payment_events already exist (created by
// StripeController's ensureStripeInfrastructure) — reuse them rather than
// forking parallel tables, per the migration plan's explicit guidance.
// Only provider_reference is genuinely missing (Stripe rows key off
// stripe_payment_intent_id instead), so it's added additively here.
export async function ensureFlutterwaveInfrastructure() {
  await query(`
    create table if not exists public.payments (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references public.profiles(id) on delete cascade,
      shipment_id uuid references public.shipment_requests(id) on delete set null,
      package_id uuid references public.packages(id) on delete set null,
      trip_id uuid references public.trips(id) on delete set null,
      provider text not null default 'stripe',
      payment_method text,
      stripe_payment_intent_id text,
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
      add column if not exists provider_reference text
  `);
  await query(`
    create unique index if not exists payments_provider_reference_key
      on public.payments (provider, provider_reference)
      where provider_reference is not null
  `);

  await query(`
    create table if not exists public.payout_beneficiaries (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.profiles(id) on delete cascade,
      provider text not null,
      currency text not null,
      country text,
      type text not null default 'bank',
      account_holder_name text,
      account_number text,
      bank_code text,
      bank_name text,
      iban text,
      swift_code text,
      masked_display text,
      is_active boolean not null default true,
      created_at timestamptz not null default timezone('utc', now()),
      updated_at timestamptz not null default timezone('utc', now())
    )
  `);
  await query(`
    create index if not exists payout_beneficiaries_user_active_idx
      on public.payout_beneficiaries (user_id) where is_active = true
  `);
  // Flutterwave's orchestrated transfer flow (required for EUR/GBP/EGP/INR)
  // needs a recipient — and for those specific currencies, also a sender —
  // created once via POST /transfers/recipients and /transfers/senders, then
  // referenced by id on every subsequent transfer rather than re-created
  // each time. Nullable: African-currency beneficiaries keep using the flat
  // account_bank/account_number transfer call and never populate these.
  await query(`
    alter table public.payout_beneficiaries
      add column if not exists flutterwave_recipient_id text,
      add column if not exists flutterwave_sender_id text
  `);
}

export async function recordPaymentInitiated({ provider, providerReference, userId, amount, currency, rawResponse = {} }) {
  await ensureFlutterwaveInfrastructure();
  return queryOne(
    `
      insert into public.payments (provider, provider_reference, user_id, amount, currency, status, raw_response)
      values ($1,$2,$3,$4,$5,'initiated',$6::jsonb)
      on conflict (provider, provider_reference)
        where provider_reference is not null
      do update
        set updated_at = timezone('utc', now())
      returning id
    `,
    [provider, providerReference, userId, amount, currency, JSON.stringify(rawResponse)],
  );
}

export async function markPaymentVerified({ provider, providerReference, status, rawResponse = {} }) {
  await ensureFlutterwaveInfrastructure();
  return queryOne(
    `
      update public.payments
      set status = $3, raw_response = raw_response || $4::jsonb, updated_at = timezone('utc', now())
      where provider = $1 and provider_reference = $2
      returning id, user_id, amount, currency
    `,
    [provider, providerReference, status, JSON.stringify(rawResponse)],
  );
}

function maskAccount({ accountNumber, iban }) {
  if (iban) {
    const cleaned = iban.replace(/\s/g, '');
    return `${cleaned.slice(0, 4)} •••• •••• ${cleaned.slice(-4)}`;
  }
  if (accountNumber) {
    return `•••• ${String(accountNumber).slice(-4)}`;
  }
  return null;
}

export async function saveBeneficiary({
  userId, currency, country, type, accountHolderName, accountNumber, bankCode, bankName, iban, swiftCode,
  flutterwaveRecipientId, flutterwaveSenderId,
}) {
  await ensureFlutterwaveInfrastructure();
  return withTransaction(async (client) => {
    await client.query(
      `update public.payout_beneficiaries set is_active = false, updated_at = timezone('utc', now()) where user_id = $1 and is_active = true`,
      [userId],
    );
    const result = await client.query(
      `
        insert into public.payout_beneficiaries (
          user_id, provider, currency, country, type, account_holder_name,
          account_number, bank_code, bank_name, iban, swift_code, masked_display,
          flutterwave_recipient_id, flutterwave_sender_id
        )
        values ($1,'flutterwave',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        returning id, masked_display
      `,
      [
        userId, currency, country || null, type, accountHolderName || null,
        accountNumber || null, bankCode || null, bankName || null, iban || null, swiftCode || null,
        maskAccount({ accountNumber, iban }),
        flutterwaveRecipientId || null, flutterwaveSenderId || null,
      ],
    );
    return result.rows[0];
  });
}

export async function getActiveBeneficiary(userId) {
  await ensureFlutterwaveInfrastructure();
  return queryOne(
    `select * from public.payout_beneficiaries where user_id = $1 and is_active = true order by created_at desc limit 1`,
    [userId],
  );
}
