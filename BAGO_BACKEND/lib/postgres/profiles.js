import bcrypt from 'bcrypt';

import { query, queryOne, withTransaction } from './db.js';

function normalizeProfileRow(row) {
  if (!row) return null;

  return {
    ...row,
    _id: row.id,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    image: row.image_url,
    signupMethod: row.signup_method,
    dateOfBirth: row.date_of_birth,
    emailVerified: row.email_verified,
    kycStatus: row.kyc_status,
    paymentGateway: row.payment_gateway,
    preferredCurrency: row.preferred_currency,
    stripeAccountId: row.stripe_account_id,
    stripeConnectAccountId: row.stripe_connect_account_id,
    stripeVerified: row.stripe_verified,
    paystackRecipientCode: row.paystack_recipient_code,
    bankDetails: row.bank_details || {},
    payoutMethod: row.payout_method,
    pushTokens: row.push_tokens || [],
    communicationPrefs: row.communication_prefs || { push: true, email: true, sms: false },
    selectedAvatar: row.selected_avatar,
    password: row.password_hash,
    pendingEmail: row.pending_email,
    balance: row.available_balance ?? 0,
    escrowBalance: row.escrow_balance ?? 0,
    walletBalance: row.available_balance ?? 0,
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
    p.status,
    p.country,
    p.date_of_birth,
    p.banned,
    p.email_verified,
    p.push_tokens,
    p.communication_prefs,
    p.referral_code,
    p.referred_by,
    p.has_used_referral_discount,
    p.kyc_status,
    p.didit_session_id,
    p.didit_session_token,
    p.kyc_verified_at,
    p.kyc_verified_data,
    p.identity_fingerprint,
    p.kyc_failure_reason,
    p.stripe_account_id,
    p.stripe_connect_account_id,
    p.stripe_verified,
    p.paystack_recipient_code,
    p.bank_details,
    p.payout_method,
    p.payment_gateway,
    p.preferred_currency,
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
    p.created_at,
    p.updated_at,
    w.available_balance,
    w.escrow_balance,
    w.currency as wallet_currency
  from public.profiles p
  left join public.wallet_accounts w on w.user_id = p.id
`;

export async function findProfileById(id) {
  const row = await queryOne(`${baseSelect} where p.id = $1`, [id]);
  return normalizeProfileRow(row);
}

export async function findProfileByEmail(email) {
  const row = await queryOne(`${baseSelect} where lower(p.email::text) = lower($1)`, [email]);
  return normalizeProfileRow(row);
}

export async function findProfileByReferralCode(referralCode) {
  const row = await queryOne(`${baseSelect} where p.referral_code = $1`, [referralCode]);
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
  emailVerified = true,
  imageUrl = null,
}) {
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
          signup_method,
          email_verified,
          image_url,
          status
        )
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'verified')
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
          phone_change_otp_expires_at = null
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
  const result = await query(
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
  
  if (result.rows.length === 0) {
    console.warn(`⚠️ addPushToken: No profile found for user ${userId}`);
  } else {
    console.log(`✅ addPushToken: user=${userId}, tokenCount=${result.rows[0].token_count}`);
  }
  
  return result.rows[0] || null;
}

export async function updatePreferredCurrency(userId, currency, paymentGateway) {
  await query(
    `
      update public.profiles
      set preferred_currency = $2,
          payment_gateway = $3
      where id = $1
    `,
    [userId, currency, paymentGateway],
  );

  await query(
    `
      update public.wallet_accounts
      set currency = $2
      where user_id = $1
    `,
    [userId, currency],
  );
}

export async function getWalletByUserId(userId) {
  const wallet = await queryOne(
    `
      select id, user_id, available_balance, escrow_balance, currency, created_at, updated_at
      from public.wallet_accounts
      where user_id = $1
    `,
    [userId],
  );

  if (!wallet) return null;

  const history = await query(
    `
      select id, type, amount, currency, status, description, metadata, created_at
      from public.wallet_transactions
      where user_id = $1
      order by created_at desc
    `,
    [userId],
  );

  return {
    ...wallet,
    balance: Number(wallet.available_balance || 0),
    escrowBalance: Number(wallet.escrow_balance || 0),
    history: history.rows,
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

export async function createOrUpdateGoogleProfile({
  email,
  firstName,
  lastName,
  imageUrl,
  country = 'United States',
  referralCode = null,
  promoCode = null,
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
  const paymentGateway = country === 'Nigeria' ? 'paystack' : 'stripe';
  const preferredCurrency = country === 'Nigeria' ? 'NGN' : 'USD';

  const user = await createProfileWithWallet({
    firstName,
    lastName,
    email,
    phone: null,
    passwordHash: fallbackPassword,
    referredBy,
    country,
    dateOfBirth: '2000-01-01',
    paymentGateway,
    preferredCurrency,
    signupMethod: 'google',
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
