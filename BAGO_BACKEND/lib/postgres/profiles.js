import bcrypt from 'bcrypt';

import { query, queryOne, withTransaction } from './db.js';
import { convertCurrency } from '../../services/currencyConverter.js';
import { getCurrencyByCountry, getPaymentGateway } from '../../constants/countries.js';

const AFRICAN_PAYOUT_CURRENCIES = new Set([
  'AOA', 'BIF', 'BWP', 'CDF', 'CVE', 'DJF', 'DZD', 'EGP', 'ERN', 'ETB',
  'GHS', 'GMD', 'GNF', 'KES', 'KMF', 'LRD', 'LSL', 'LYD', 'MAD', 'MGA',
  'MRU', 'MUR', 'MWK', 'MZN', 'NAD', 'NGN', 'RWF', 'SCR', 'SDG', 'SLE',
  'SOS', 'SSP', 'STN', 'SZL', 'TZS', 'UGX', 'XAF', 'XOF', 'ZAR', 'ZMW',
  'ZWL',
]);

// Ensure earning_currency columns exist — runs once at startup, not lazily
let _earningCurrencyEnsured = false;
async function ensureEarningCurrencyColumns() {
  if (_earningCurrencyEnsured) return;
  await query(`
    ALTER TABLE public.profiles
      ADD COLUMN IF NOT EXISTS earning_currency TEXT,
      ADD COLUMN IF NOT EXISTS earning_currency_locked BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS payout_currency TEXT,
      ADD COLUMN IF NOT EXISTS payout_status TEXT,
      ADD COLUMN IF NOT EXISTS payout_provider TEXT,
      ADD COLUMN IF NOT EXISTS payout_method TEXT,
      ADD COLUMN IF NOT EXISTS payout_method_status TEXT,
      ADD COLUMN IF NOT EXISTS accepted_terms BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS referral_code TEXT,
      ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS has_used_referral_discount BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS verified_first_name TEXT,
      ADD COLUMN IF NOT EXISTS verified_middle_name TEXT,
      ADD COLUMN IF NOT EXISTS verified_last_name TEXT,
      ADD COLUMN IF NOT EXISTS verified_full_legal_name TEXT,
      ADD COLUMN IF NOT EXISTS verified_date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS kyc_provider TEXT,
      ADD COLUMN IF NOT EXISTS verification_provider TEXT,
      ADD COLUMN IF NOT EXISTS identity_fields_locked BOOLEAN NOT NULL DEFAULT FALSE
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS profiles_referral_code_idx
      ON public.profiles (upper(referral_code))
      WHERE referral_code IS NOT NULL
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS profiles_referred_by_idx
      ON public.profiles (referred_by)
      WHERE referred_by IS NOT NULL
  `);
  await query(`
    UPDATE public.profiles
    SET earning_currency = preferred_currency
    WHERE earning_currency IS NULL AND preferred_currency IS NOT NULL
  `);
  await query(`
    UPDATE public.profiles
    SET earning_currency_locked = FALSE
    WHERE earning_currency_locked IS TRUE
  `);
  _earningCurrencyEnsured = true;
}

// Run migration immediately when this module is imported
ensureEarningCurrencyColumns().catch((err) =>
  console.error('[profiles] earning_currency migration failed:', err.message)
);

function normalizeProfileRow(row) {
  if (!row) return null;

  return {
    ...row,
    _id: row.id,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    accountStatus: row.account_status || 'active',
    googleSub: row.google_sub || null,
    deviceFingerprint: row.device_fingerprint || null,
    isFlagged: row.is_flagged ?? false,
    image: row.image_url,
    signupMethod: row.signup_method,
    signupSource: row.signup_source,
    dateOfBirth: row.date_of_birth,
    emailVerified: row.email_verified,
    phoneVerified: row.phone_verified ?? false,
    phoneVerifiedAt: row.phone_verified_at,
    kycStatus: row.kyc_status,
    paymentGateway: row.payment_gateway,
    preferredCurrency: row.preferred_currency,
    earningCurrency: row.earning_currency || row.preferred_currency || null,
    earningCurrencyLocked: row.earning_currency_locked ?? false,
    stripeAccountId: row.stripe_account_id,
    stripeConnectAccountId: row.stripe_connect_account_id,
    stripeVerified: row.stripe_verified,
    paystackRecipientCode: row.paystack_recipient_code,
    payoutCurrency: row.payout_currency,
    payoutStatus: row.payout_status,
    payoutProvider: row.payout_provider,
    payoutMethodStatus: row.payout_method_status,
    acceptedTerms: row.accepted_terms ?? false,
    acceptedTermsAt: row.accepted_terms_at,
    bankDetails: row.bank_details || {},
    payoutMethod: row.payout_method,
    pushTokens: row.push_tokens || [],
    communicationPrefs: row.communication_prefs || { push: true, email: true, sms: false },
    selectedAvatar: row.selected_avatar,
    pendingEmail: row.pending_email,
    pendingPhone: row.pending_phone,
    phone_change_otp_code: row.phone_change_otp_code,
    phone_change_otp_expires_at: row.phone_change_otp_expires_at,
    kycVerifiedAt: row.kyc_verified_at,
    kycVerifiedData: row.kyc_verified_data,
    kycFailureReason: row.kyc_failure_reason,
    identityFingerprint: row.identity_fingerprint,
    balance: row.available_balance ?? 0,
    escrowBalance: row.escrow_balance ?? 0,
    walletBalance: row.available_balance ?? 0,
    walletCurrency: row.wallet_currency || row.preferred_currency || 'USD',
    failed_login_attempts: row.failed_login_attempts ?? 0,
    locked_until: row.locked_until ?? null,
  };
}

const baseSelect = `
  select
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    p.phone,
    p.image_url,
    p.selected_avatar,
    p.role,
    p.signup_method,
    p.signup_source,
    p.status,
    p.account_status,
    p.google_sub,
    p.device_fingerprint,
    p.is_flagged,
    p.country,
    p.date_of_birth,
    p.banned,
    p.email_verified,
    COALESCE(p.phone_verified, false) AS phone_verified,
    p.push_tokens,
    p.communication_prefs,
    p.referral_code,
    p.referred_by,
    p.has_used_referral_discount,
    p.kyc_status,
    p.kyc_verified_at,
    p.kyc_verified_data,
    p.identity_fingerprint,
    p.kyc_failure_reason,
    p.stripe_account_id,
    p.stripe_connect_account_id,
    p.stripe_verified,
    p.paystack_recipient_code,
    p.payout_currency,
    p.payout_status,
    p.payout_provider,
    p.payout_method_status,
    COALESCE(p.accepted_terms, false) AS accepted_terms,
    p.accepted_terms_at,
    p.bank_details,
    p.payout_method,
    p.payment_gateway,
    p.preferred_currency,
    p.earning_currency,
    p.earning_currency_locked,
    p.completed_trips,
    p.cancellations,
    p.rating,
    p.bio,
    p.password_hash,
    p.otp_code,
    p.otp_expires_at,
    p.pending_email,
    p.email_change_otp_code,
    p.email_change_otp_expires_at,
    p.pending_phone,
    p.phone_change_otp_code,
    p.phone_change_otp_expires_at,
    p.phone_verified,
    p.phone_verified_at,
    p.created_at,
    p.updated_at,
    w.available_balance,
    w.escrow_balance,
    w.currency as wallet_currency
  from public.profiles p
  left join public.wallet_accounts w on w.user_id = p.id
`;

export async function findProfileById(id) {
  await ensureEarningCurrencyColumns();
  const row = await queryOne(`${baseSelect} where p.id = $1`, [id]);
  return normalizeProfileRow(row);
}

export async function findProfileByEmail(email) {
  await ensureEarningCurrencyColumns();
  const row = await queryOne(`${baseSelect} where lower(p.email::text) = lower($1)`, [email]);
  return normalizeProfileRow(row);
}

export async function findProfileByReferralCode(referralCode) {
  await ensureEarningCurrencyColumns();
  const row = await queryOne(`${baseSelect} where upper(p.referral_code) = upper($1)`, [referralCode]);
  return normalizeProfileRow(row);
}

/**
 * Check if an account already exists with the same full name and date of birth.
 * Only matches when both firstName, lastName, and a real DOB are provided.
 * Returns true if a duplicate exists.
 */
export async function checkDuplicateNameDob(firstName, lastName, dateOfBirth) {
  if (!firstName || !lastName || !dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return false;
  // Skip the common default DOB used when no DOB is provided
  const dobStr = dob.toISOString().split('T')[0];
  if (dobStr === '2000-01-01') return false;
  const row = await queryOne(
    `select id from public.profiles
     where lower(trim(first_name)) = lower(trim($1))
       and lower(trim(last_name))  = lower(trim($2))
       and date_of_birth::date = $3::date
     limit 1`,
    [firstName, lastName, dobStr],
  );
  return !!row;
}

export async function createProfileWithWallet({
  firstName,
  lastName,
  email,
  phone,
  passwordHash,
  referredBy,
  country,
  dateOfBirth,
  paymentGateway,
  preferredCurrency,
  signupMethod = 'email',
  signupSource = 'app',
  emailVerified = true,
  imageUrl = null,
}) {
  await ensureEarningCurrencyColumns();
  return withTransaction(async (client) => {
    const profileResult = await client.query(
      `
        insert into public.profiles (
          email,
          first_name,
          last_name,
          phone,
          password_hash,
          referred_by,
          country,
          date_of_birth,
          payment_gateway,
          preferred_currency,
          earning_currency,
          signup_method,
          signup_source,
          email_verified,
          image_url,
          status
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,$11,$12,$13,$14,'verified')
        returning id
      `,
      [
        email,
        firstName,
        lastName,
        phone,
        passwordHash,
        referredBy,
        country,
        dateOfBirth,
        paymentGateway,
        preferredCurrency,
        signupMethod,
        signupSource,
        emailVerified,
        imageUrl,
      ],
    );

    const profileId = profileResult.rows[0].id;

    await client.query(
      `
        insert into public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
        values ($1, 0, 0, $2)
        on conflict (user_id) do nothing
      `,
      [profileId, preferredCurrency || 'USD'],
    );

    const createdResult = await client.query(
      `${baseSelect} where p.id = $1`,
      [profileId],
    );

    return normalizeProfileRow(createdResult.rows[0] ?? null);
  });
}

export async function updatePasswordOtp(email, otpCode, otpExpiresAt) {
  await query(
    `
      update public.profiles
      set otp_code = $2, otp_expires_at = $3
      where lower(email::text) = lower($1)
    `,
    [email, otpCode, otpExpiresAt],
  );
}

export async function clearOtpAndUpdatePassword(email, passwordHash) {
  await query(
    `
      update public.profiles
      set password_hash = $2, otp_code = null, otp_expires_at = null
      where lower(email::text) = lower($1)
    `,
    [email, passwordHash],
  );
}

export async function setPendingEmailChange(userId, pendingEmail, otpCode, otpExpiresAt) {
  await query(
    `
      update public.profiles
      set pending_email = $2,
          email_change_otp_code = $3,
          email_change_otp_expires_at = $4
      where id = $1
    `,
    [userId, pendingEmail, otpCode, otpExpiresAt],
  );
}

export async function confirmPendingEmailChange(userId, email) {
  await query(
    `
      update public.profiles
      set email = $2,
          pending_email = null,
          email_change_otp_code = null,
          email_change_otp_expires_at = null,
          email_verified = true
      where id = $1
    `,
    [userId, email],
  );
}

export async function setPendingPhoneChange(userId, pendingPhone, otpCode, otpExpiresAt) {
  await query(
    `
      update public.profiles
      set pending_phone = $2,
          phone_change_otp_code = $3,
          phone_change_otp_expires_at = $4
      where id = $1
    `,
    [userId, pendingPhone, otpCode, otpExpiresAt],
  );
}

export async function confirmPendingPhoneChange(userId, phone) {
  await query(
    `
      update public.profiles
      set phone = $2,
          pending_phone = null,
          phone_change_otp_code = null,
          phone_change_otp_expires_at = null,
          phone_verified = true,
          phone_verified_at = timezone('utc', now())
      where id = $1
    `,
    [userId, phone],
  );
}

export async function clearPushTokens(userId) {
  const result = await query(
    `update public.profiles set push_tokens = '{}', updated_at = timezone('utc', now()) where id = $1 returning id`,
    [userId],
  );
  console.log(`🔕 clearPushTokens: user=${userId}, cleared=${result.rows.length > 0}`);
  return result.rows[0] || null;
}

export async function addPushToken(userId, token) {
  const result = await withTransaction(async (client) => {
    await client.query(
      `
        update public.profiles
        set push_tokens = array_remove(coalesce(push_tokens, '{}'), $2),
            updated_at = timezone('utc', now())
        where id <> $1
          and $2 = any(coalesce(push_tokens, '{}'))
      `,
      [userId, token],
    );

    return client.query(
      `
        update public.profiles
        set push_tokens = case
          when $2 = any(coalesce(push_tokens, '{}')) then coalesce(push_tokens, '{}')
          else array_append(coalesce(push_tokens, '{}'), $2)
        end,
        updated_at = timezone('utc', now())
        where id = $1
        returning id, array_length(push_tokens, 1) as token_count
      `,
      [userId, token],
    );
  });
  
  if (result.rows.length === 0) {
    console.warn(`⚠️ addPushToken: No profile found for user ${userId}`);
  } else {
    console.log(`✅ addPushToken: user=${userId}, tokenCount=${result.rows[0].token_count}`);
  }
  
  return result.rows[0] || null;
}

export async function updatePreferredCurrency(userId, currency, paymentGateway, oldCurrency = null) {
  const profile = await queryOne(
    `SELECT earning_currency_locked FROM public.profiles WHERE id = $1`,
    [userId],
  );
  if (profile?.earning_currency_locked) {
    const err = new Error('Your currency is locked. Contact support to change it.');
    err.statusCode = 403;
    throw err;
  }
  await query(
    `
      update public.profiles
      set preferred_currency = $2,
          payment_gateway = $3
      where id = $1
    `,
    [userId, currency, paymentGateway],
  );

  // Convert balance from old currency to new currency using live exchange rates
  const wallet = await queryOne(
    `select available_balance, escrow_balance, currency from public.wallet_accounts where user_id = $1`,
    [userId],
  );

  // Use wallet.currency first; fall back to oldCurrency for accounts where wallet.currency was never set
  const fromCurrency = wallet?.currency || oldCurrency;

  if (wallet && fromCurrency && fromCurrency.toUpperCase() !== currency.toUpperCase()) {
    const newAvailable = Number(
      (await convertCurrency(Number(wallet.available_balance || 0), fromCurrency, currency)).toFixed(2),
    );
    const newEscrow = Number(
      (await convertCurrency(Number(wallet.escrow_balance || 0), fromCurrency, currency)).toFixed(2),
    );
    await query(
      `update public.wallet_accounts set currency = $2, available_balance = $3, escrow_balance = $4 where user_id = $1`,
      [userId, currency, newAvailable, newEscrow],
    );
  } else {
    await query(
      `update public.wallet_accounts set currency = $2 where user_id = $1`,
      [userId, currency],
    );
  }
}

// Updates traveler payout currency. Currency conversion is handled server-side
// when ledger entries and wallet balances are created or displayed.
const PAYSTACK_LOCK_CURRENCIES = new Set(['NGN', 'GHS', 'KES', 'ZAR']);

export async function activateEarningCurrency(userId, currency) {
  await ensureEarningCurrencyColumns();
  const upper = currency.toUpperCase();
  const paymentGateway = AFRICAN_PAYOUT_CURRENCIES.has(upper) ? 'paystack' : 'stripe';
  const locked = PAYSTACK_LOCK_CURRENCIES.has(upper);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE public.profiles SET earning_currency = $2, earning_currency_locked = $4,
       preferred_currency = $2, payment_gateway = $3, updated_at = NOW() WHERE id = $1`,
      [userId, upper, paymentGateway, locked],
    );

    const walletResult = await client.query(
      `SELECT available_balance, escrow_balance, currency
       FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    const wallet = walletResult.rows[0];
    const fromCurrency = (wallet?.currency || '').toString().toUpperCase();

    if (wallet && fromCurrency && fromCurrency !== upper) {
      const newAvailable = Number(
        (await convertCurrency(Number(wallet.available_balance || 0), fromCurrency, upper)).toFixed(2),
      );
      const newEscrow = Number(
        (await convertCurrency(Number(wallet.escrow_balance || 0), fromCurrency, upper)).toFixed(2),
      );
      await client.query(
        `UPDATE public.wallet_accounts
         SET currency = $2, available_balance = $3, escrow_balance = $4, updated_at = NOW()
         WHERE user_id = $1`,
        [userId, upper, newAvailable, newEscrow],
      );
    } else {
      await client.query(
        `UPDATE public.wallet_accounts SET currency = $2, updated_at = NOW() WHERE user_id = $1`,
        [userId, upper],
      );
    }
  });
  return findProfileById(userId);
}

// Admin-only: settle old balance and set new earning currency
export async function adminChangeEarningCurrency(userId, newCurrency, settleBalance, adminNote) {
  await ensureEarningCurrencyColumns();
  const upper = newCurrency.toUpperCase();
  const paymentGateway = AFRICAN_PAYOUT_CURRENCIES.has(upper) ? 'paystack' : 'stripe';

  await withTransaction(async (client) => {
    if (settleBalance) {
      const wallet = await client.query(
        `SELECT available_balance, currency FROM public.wallet_accounts WHERE user_id = $1`,
        [userId],
      );
      const w = wallet.rows[0];
      if (w && Number(w.available_balance) > 0) {
        await client.query(
          `INSERT INTO public.wallet_transactions
           (wallet_id, user_id, type, amount, currency, status, description, metadata)
           SELECT id, user_id, 'admin_settlement', available_balance, currency, 'completed', $2, $3
           FROM public.wallet_accounts WHERE user_id = $1`,
          [userId, adminNote || 'Admin settlement before earning currency change', JSON.stringify({ adminAction: true })],
        );
        await client.query(
          `UPDATE public.wallet_accounts SET available_balance = 0, updated_at = NOW() WHERE user_id = $1`,
          [userId],
        );
      }
    }
    const locked = PAYSTACK_LOCK_CURRENCIES.has(upper);
    await client.query(
      `UPDATE public.profiles SET earning_currency = $2, preferred_currency = $2,
       payment_gateway = $3, earning_currency_locked = $4, updated_at = NOW() WHERE id = $1`,
      [userId, upper, paymentGateway, locked],
    );

    // Convert existing balance to new currency (same logic as user-side activateEarningCurrency)
    const walletResult = await client.query(
      `SELECT available_balance, escrow_balance, currency
       FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE`,
      [userId],
    );
    const wallet = walletResult.rows[0];
    const fromCurrency = (wallet?.currency || '').toString().toUpperCase();

    if (wallet && fromCurrency && fromCurrency !== upper && !settleBalance) {
      const newAvailable = Number(
        (await convertCurrency(Number(wallet.available_balance || 0), fromCurrency, upper)).toFixed(2),
      );
      const newEscrow = Number(
        (await convertCurrency(Number(wallet.escrow_balance || 0), fromCurrency, upper)).toFixed(2),
      );
      await client.query(
        `UPDATE public.wallet_accounts
         SET currency = $2, available_balance = $3, escrow_balance = $4, updated_at = NOW()
         WHERE user_id = $1`,
        [userId, upper, newAvailable, newEscrow],
      );
    } else {
      await client.query(
        `UPDATE public.wallet_accounts SET currency = $2, updated_at = NOW() WHERE user_id = $1`,
        [userId, upper],
      );
    }
  });
  return findProfileById(userId);
}

export async function getWalletByUserId(userId) {
  let wallet = await queryOne(
    `
      select id, user_id, available_balance, escrow_balance, currency, created_at, updated_at
      from public.wallet_accounts
      where user_id = $1
    `,
    [userId],
  );

  if (!wallet) {
    wallet = await queryOne(
      `
        insert into public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
        select id, 0, 0, coalesce(earning_currency, preferred_currency, 'USD')
        from public.profiles
        where id = $1
        on conflict (user_id) do update
          set currency = coalesce(public.wallet_accounts.currency, excluded.currency)
        returning id, user_id, available_balance, escrow_balance, currency, created_at, updated_at
      `,
      [userId],
    );
  }

  if (!wallet) return null;

  let historyRows = [];
  try {
    const history = await query(
      `
        select
          wt.id,
          wt.request_id,
          wt.trip_id,
          wt.type::text as type,
          wt.amount,
          wt.currency,
          wt.status,
          wt.description,
          wt.metadata,
          wt.created_at,
          sr.tracking_number,
          sr.status as shipment_status,
          sr.amount as shipment_amount,
          sr.currency as shipment_currency,
          t.trip_number,
          t.from_location as trip_from_location,
          t.to_location as trip_to_location
        from public.wallet_transactions wt
        left join public.shipment_requests sr on sr.id = wt.request_id
        left join public.trips t on t.id = coalesce(wt.trip_id, sr.trip_id)
        where wt.user_id = $1
        order by wt.created_at desc
        limit 200
      `,
      [userId],
    );
    historyRows = history.rows;
  } catch (error) {
    console.warn('Wallet transaction history unavailable, returning balance only:', error.message);
  }
  let ledgerRows = [];
  try {
    const ledgerHistory = await query(
      `
        select
          concat('ledger:', sl.id::text) as id,
          sl.shipment_id as request_id,
          sr.trip_id,
          case
            when sl.wallet_credit_created is true then 'earning'
            when sl.escrow_status = 'held' then 'escrow_hold'
            else 'pending_earning'
          end as type,
          coalesce(sl.converted_traveler_earning, sl.traveler_earning_amount, 0) as amount,
          sl.traveler_wallet_currency as currency,
          case
            when sl.wallet_credit_created is true then 'completed'
            when sl.escrow_status = 'held' then 'pending'
            else coalesce(sl.payout_status, 'pending')
          end as status,
          case
            when sl.wallet_credit_created is true then concat('Shipment earning', case when sr.tracking_number is not null then concat(' — ', sr.tracking_number) else '' end)
            when sl.escrow_status = 'held' then concat('Held in escrow', case when sr.tracking_number is not null then concat(' — ', sr.tracking_number) else '' end)
            else concat('Shipment payout pending', case when sr.tracking_number is not null then concat(' — ', sr.tracking_number) else '' end)
          end as description,
          sl.provider_payload as metadata,
          sl.created_at,
          sr.tracking_number,
          sr.status as shipment_status,
          sr.amount as shipment_amount,
          sr.currency as shipment_currency,
          t.trip_number,
          t.from_location as trip_from_location,
          t.to_location as trip_to_location
        from public.shipment_ledgers sl
        left join public.shipment_requests sr on sr.id = sl.shipment_id
        left join public.trips t on t.id = sr.trip_id
        where sl.traveler_id = $1
          and not exists (
            select 1
            from public.wallet_transactions wt
            where wt.user_id = $1
              and wt.request_id = sl.shipment_id
              and wt.type::text in ('earning', 'escrow_hold')
          )
        order by sl.created_at desc
        limit 200
      `,
      [userId],
    );
    ledgerRows = ledgerHistory.rows;
  } catch (error) {
    console.warn('Wallet ledger history unavailable, using wallet transactions only:', error.message);
  }
  let totals = { all_time_received: 0, all_time_expenses: 0 };
  try {
    totals = await queryOne(
      `
        select
          coalesce(sum(amount) filter (where type::text in ('earning', 'signup_bonus', 'admin_settlement', 'credit', 'release', 'deposit', 'escrow_release') and status = 'completed'), 0) as all_time_received,
          coalesce(sum(amount) filter (where type::text in ('withdrawal', 'withdraw', 'payout') and status = 'completed'), 0) as all_time_expenses
        from public.wallet_transactions
        where user_id = $1
      `,
      [userId],
    );
  } catch (error) {
    console.warn('Wallet transaction totals unavailable, returning balance only:', error.message);
  }
  let ledgerTotals = null;
  try {
    ledgerTotals = await queryOne(
      `
        select
          coalesce(sum(converted_traveler_earning) filter (where wallet_credit_created is true), 0) as released_earnings,
          coalesce(sum(converted_traveler_earning) filter (where escrow_status = 'held'), 0) as held_earnings
        from public.shipment_ledgers
        where traveler_id = $1
      `,
      [userId],
    );
  } catch (error) {
    console.warn('Wallet ledger totals unavailable, using wallet transaction totals only:', error.message);
  }
  const USER_STATUS_MAP = {
    pending_admin_approval: 'under_review',
    pending_admin_review:   'under_review',
    pending_purchase:       'processing',
    pending_earning:        'pending',
    not_selected:           'pending',
  };

  const combinedHistory = [...historyRows, ...ledgerRows]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .map(row => ({
      ...row,
      status: USER_STATUS_MAP[String(row.status || '').toLowerCase()] || row.status,
    }));
  const balance = Number(wallet.available_balance || 0);
  const escrowBalance = Number(wallet.escrow_balance || 0);

  return {
    ...wallet,
    balance,
    walletBalance: balance,
    wallet_balance: balance,
    availableBalance: balance,
    available_balance: balance,
    escrowBalance,
    escrow_balance: escrowBalance,
    allTimeReceived: Math.max(
      Number(totals?.all_time_received || 0),
      Number(ledgerTotals?.released_earnings || 0),
    ),
    allTimeExpenses: Number(totals?.all_time_expenses || 0),
    heldEarnings: Number(ledgerTotals?.held_earnings || 0),
    transactions: combinedHistory,
    history: combinedHistory,
  };
}

export async function updateStripeConnectState(userId, updates = {}) {
  const fields = [];
  const values = [];
  let index = 1;

  if (updates.stripeAccountId !== undefined) {
    fields.push(`stripe_account_id = $${index}`);
    values.push(updates.stripeAccountId);
    index += 1;
  }
  if (updates.stripeConnectAccountId !== undefined) {
    fields.push(`stripe_connect_account_id = $${index}`);
    values.push(updates.stripeConnectAccountId);
    index += 1;
  }
  if (updates.stripeVerified !== undefined) {
    fields.push(`stripe_verified = $${index}`);
    values.push(Boolean(updates.stripeVerified));
    index += 1;
  }
  if (updates.payoutMethod !== undefined) {
    fields.push(`payout_method = $${index}`);
    values.push(updates.payoutMethod);
    index += 1;
  }

  if (!fields.length) {
    return findProfileById(userId);
  }

  values.push(userId);
  await query(
    `update public.profiles set ${fields.join(', ')}, updated_at = timezone('utc', now()) where id = $${index}`,
    values,
  );

  return findProfileById(userId);
}

export async function findActivePromoCode(code) {
  return queryOne(
    `
      select *
      from public.promo_codes
      where upper(code) = upper($1)
        and is_active = true
    `,
    [code],
  );
}

export async function incrementPromoUsage(code) {
  await query(
    `
      update public.promo_codes
      set used_count = used_count + 1
      where upper(code) = upper($1)
    `,
    [code],
  );
}

export async function applySignupBonus(userId, promoCode) {
  return withTransaction(async (client) => {
    const promoResult = await client.query(
      `
        select code, is_signup_bonus, signup_bonus_amount
        from public.promo_codes
        where upper(code) = upper($1) and is_active = true
        for update
      `,
      [promoCode],
    );

    const promo = promoResult.rows[0];
    if (!promo || !promo.is_signup_bonus || Number(promo.signup_bonus_amount || 0) <= 0) {
      return;
    }

    await client.query(
      `
        update public.wallet_accounts
        set available_balance = available_balance + $2
        where user_id = $1
      `,
      [userId, promo.signup_bonus_amount],
    );

    await client.query(
      `
        insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, description)
        select id, user_id, 'signup_bonus', $2, currency, 'completed', 'Signup bonus'
        from public.wallet_accounts
        where user_id = $1
      `,
      [userId, promo.signup_bonus_amount],
    );

    await client.query(
      `
        update public.promo_codes
        set used_count = used_count + 1
        where upper(code) = upper($1)
      `,
      [promo.code],
    );
  });
}

export async function findProfileByAppleSub(appleSub) {
  const row = await queryOne(
    `SELECT id FROM public.profiles WHERE apple_sub = $1 LIMIT 1`,
    [appleSub],
  );
  if (!row) return null;
  return findProfileById(row.id);
}

export async function createOrUpdateAppleProfile({
  appleSub,
  email,
  firstName,
  lastName,
  country = 'United States',
  preferredCurrency = null,
  paymentGateway = null,
  signupSource = 'ios',
}) {
  // Lookup by Apple sub first (handles subsequent sign-ins where email is absent)
  const existingBySub = await findProfileByAppleSub(appleSub);
  if (existingBySub) {
    const updated = await queryOne(
      `UPDATE public.profiles
       SET first_name = COALESCE(NULLIF($2, ''), first_name),
           last_name  = COALESCE(NULLIF($3, ''), last_name),
           updated_at = timezone('utc', now())
       WHERE id = $1
       RETURNING id`,
      [existingBySub.id, firstName || null, lastName || null],
    );
    return { user: await findProfileById(updated.id), isNewUser: false };
  }

  // Lookup by email and link Apple sub
  if (email) {
    const existingByEmail = await findProfileByEmail(email);
    if (existingByEmail) {
      const updated = await queryOne(
        `UPDATE public.profiles
         SET apple_sub   = $2,
             first_name  = COALESCE(NULLIF($3, ''), first_name),
             last_name   = COALESCE(NULLIF($4, ''), last_name),
             email_verified = true,
             signup_method  = CASE WHEN signup_method = 'email' THEN signup_method ELSE 'apple' END,
             updated_at  = timezone('utc', now())
         WHERE id = $1
         RETURNING id`,
        [existingByEmail.id, appleSub, firstName || null, lastName || null],
      );
      return { user: await findProfileById(updated.id), isNewUser: false };
    }
  }

  if (!email) {
    throw new Error('Email is required for first-time Apple Sign In. Please allow email sharing.');
  }

  // Create new user
  const fallbackPassword = await bcrypt.hash(Math.random().toString(36).slice(-20), 10);
  const resolvedCurrency = (preferredCurrency || getCurrencyByCountry(country) || 'USD').toUpperCase();
  const resolvedGateway = paymentGateway || getPaymentGateway(country);

  const user = await createProfileWithWallet({
    firstName: firstName || 'User',
    lastName: lastName || 'Bago',
    email,
    phone: null,
    passwordHash: fallbackPassword,
    country,
    dateOfBirth: '2000-01-01',
    paymentGateway: resolvedGateway,
    preferredCurrency: resolvedCurrency,
    signupMethod: 'apple',
    signupSource,
    emailVerified: true,
  });

  await queryOne(
    `UPDATE public.profiles SET apple_sub = $2 WHERE id = $1`,
    [user.id, appleSub],
  );

  return { user: await findProfileById(user.id), isNewUser: true };
}

export async function createOrUpdateGoogleProfile({
  email,
  firstName,
  lastName,
  imageUrl,
  country = 'United States',
  preferredCurrency = null,
  paymentGateway = null,
  referralCode = null,
  promoCode = null,
  signupSource = 'app',
}) {
  const existing = await findProfileByEmail(email);
  if (existing) {
    const updated = await queryOne(
      `
        update public.profiles
        set first_name = coalesce(nullif($2, ''), first_name),
            last_name = coalesce(nullif($3, ''), last_name),
            image_url = coalesce($4, image_url),
            email_verified = true,
            signup_method = case
              when signup_method = 'email' then signup_method
              else 'google'
            end,
            updated_at = timezone('utc', now())
        where id = $1
        returning *
      `,
      [existing.id, firstName || null, lastName || null, imageUrl || null],
    );

    return {
      user: await findProfileById(updated.id),
      isNewUser: false,
      appliedPromoCode: null,
    };
  }

  let referredBy = null;
  if (referralCode) {
    const referrer = await findProfileByReferralCode(referralCode);
    if (referrer) referredBy = referrer.id;
  }

  let normalizedPromoCode = null;
  if (promoCode) {
    const promo = await findActivePromoCode(promoCode.toUpperCase());
    if (promo && (!promo.expiry_date || new Date(promo.expiry_date) >= new Date()) && (!promo.max_uses || promo.used_count < promo.max_uses)) {
      normalizedPromoCode = promo.code;
    }
  }

  const fallbackPassword = await bcrypt.hash(Math.random().toString(36).slice(-20), 10);
  const resolvedCurrency = (preferredCurrency || getCurrencyByCountry(country) || 'USD').toUpperCase();
  const resolvedGateway = paymentGateway || getPaymentGateway(country);

  const user = await createProfileWithWallet({
    firstName,
    lastName,
    email,
    phone: null,
    passwordHash: fallbackPassword,
    referredBy,
    country,
    dateOfBirth: '2000-01-01',
    paymentGateway: resolvedGateway,
    preferredCurrency: resolvedCurrency,
    signupMethod: 'google',
    signupSource,
    emailVerified: true,
    imageUrl,
  });

  if (normalizedPromoCode) {
    await applySignupBonus(user.id, normalizedPromoCode);
  }

  return {
    user: await findProfileById(user.id),
    isNewUser: true,
    appliedPromoCode: normalizedPromoCode,
  };
}
