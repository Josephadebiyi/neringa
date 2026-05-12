import { query, queryOne, withTransaction } from './db.js';
import { findProfileById, getWalletByUserId } from './profiles.js';
import { convertCurrency } from '../../services/currencyConverter.js';

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

async function ensurePaymentEventsInfrastructure(client) {
  try {
    await client.query(`
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

    await client.query(`
      create unique index if not exists payment_events_provider_event_reference_key
        on public.payment_events (provider, event_type, provider_reference)
    `);

    await client.query(`
      create table if not exists public.shipment_ledgers (
        id uuid primary key default gen_random_uuid(),
        shipment_id uuid not null references public.shipment_requests(id) on delete cascade,
        sender_id uuid not null references public.profiles(id) on delete cascade,
        traveler_id uuid not null references public.profiles(id) on delete cascade,
        payment_provider text not null,
        payment_reference text,
        payment_currency text not null,
        payment_amount numeric(14,2) not null default 0,
        bago_commission_amount numeric(14,2) not null default 0,
        payment_processing_fee numeric(14,2) not null default 0,
        insurance_fee numeric(14,2) not null default 0,
        currency_conversion_fee_or_margin numeric(14,2) not null default 0,
        traveler_earning_amount numeric(14,2) not null default 0,
        traveler_wallet_currency text not null,
        exchange_rate_used numeric(20,8) not null default 1,
        converted_traveler_earning numeric(14,2) not null default 0,
        escrow_status text not null default 'held',
        payout_status text not null default 'not_available',
        wallet_credit_created boolean not null default false,
        provider_payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default timezone('utc', now()),
        updated_at timestamptz not null default timezone('utc', now())
      )
    `);

    await client.query(`
      create unique index if not exists shipment_ledgers_shipment_id_key
        on public.shipment_ledgers (shipment_id)
    `);

    await client.query(`
      create unique index if not exists wallet_transactions_one_earning_per_request_user
        on public.wallet_transactions (request_id, user_id)
        where type = 'earning' and request_id is not null
    `);

    await client.query(`
      create unique index if not exists wallet_transactions_one_escrow_hold_per_request_user
        on public.wallet_transactions (request_id, user_id)
        where type = 'escrow_hold' and request_id is not null
    `);

    await client.query(`
      create unique index if not exists wallet_transactions_withdrawal_reference_key
        on public.wallet_transactions ((metadata->>'reference'))
        where type = 'withdrawal' and metadata ? 'reference'
    `);
  } catch (error) {
    console.warn('Payment/ledger infrastructure unavailable, continuing without it:', error.message);
  }
}

function getCommissionRate() {
  const raw = process.env.BAGO_COMMISSION_RATE || process.env.BAGO_COMMISSION_PERCENT || '0.10';
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0.10;
  return parsed > 1 ? parsed / 100 : parsed;
}

async function upsertShipmentLedger(client, {
  request,
  provider,
  providerReference,
  walletCurrency,
  convertedTravelerEarning,
  commissionAmount,
  paymentProcessingFee = 0,
  insuranceFee = 0,
  conversionFee = 0,
  exchangeRate = 1,
  travelerEarningAmount,
}) {
  await client.query(
    `
      insert into public.shipment_ledgers (
        shipment_id, sender_id, traveler_id, payment_provider, payment_reference,
        payment_currency, payment_amount, bago_commission_amount,
        payment_processing_fee, insurance_fee, currency_conversion_fee_or_margin,
        traveler_earning_amount, traveler_wallet_currency, exchange_rate_used,
        converted_traveler_earning, escrow_status, payout_status, wallet_credit_created,
        provider_payload
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'held','not_available',false,$16)
      on conflict (shipment_id) do update
      set payment_provider = excluded.payment_provider,
          payment_reference = excluded.payment_reference,
          payment_currency = excluded.payment_currency,
          payment_amount = excluded.payment_amount,
          bago_commission_amount = excluded.bago_commission_amount,
          payment_processing_fee = excluded.payment_processing_fee,
          insurance_fee = excluded.insurance_fee,
          currency_conversion_fee_or_margin = excluded.currency_conversion_fee_or_margin,
          traveler_earning_amount = excluded.traveler_earning_amount,
          traveler_wallet_currency = excluded.traveler_wallet_currency,
          exchange_rate_used = excluded.exchange_rate_used,
          converted_traveler_earning = excluded.converted_traveler_earning,
          updated_at = timezone('utc', now())
    `,
    [
      request.id,
      request.sender_id,
      request.traveler_id,
      provider,
      providerReference,
      (request.currency || 'USD').toUpperCase(),
      toNumber(request.amount),
      commissionAmount,
      paymentProcessingFee,
      insuranceFee,
      conversionFee,
      travelerEarningAmount,
      walletCurrency,
      exchangeRate,
      convertedTravelerEarning,
      { providerReference, provider },
    ],
  );
}

export async function getAccountProfile(userId) {
  return findProfileById(userId);
}

export async function updateAccountProfile(userId, updates) {
  const mapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    dateOfBirth: 'date_of_birth',
    preferredCurrency: 'preferred_currency',
    paymentGateway: 'payment_gateway',
    bio: 'bio',
    bankDetails: 'bank_details',
    country: 'country',
  };

  const fields = [];
  const values = [];
  let index = 1;

  for (const [key, value] of Object.entries(updates)) {
    const column = mapping[key];
    if (!column) continue;
    fields.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  }

  if (!fields.length) {
    return getAccountProfile(userId);
  }

  values.push(userId);
  await query(
    `update public.profiles set ${fields.join(', ')}, updated_at = timezone('utc', now()) where id = $${index}`,
    values,
  );

  if (updates.preferredCurrency) {
    await query(
      `update public.wallet_accounts set currency = $2, updated_at = timezone('utc', now()) where user_id = $1`,
      [userId, updates.preferredCurrency],
    );
  }

  return getAccountProfile(userId);
}

export async function updateProfileImage(userId, { imageUrl = null, selectedAvatar = undefined }) {
  const fields = [];
  const values = [];
  let index = 1;

  if (imageUrl !== null) {
    fields.push(`image_url = $${index}`);
    values.push(imageUrl);
    index += 1;
  }
  if (selectedAvatar !== undefined) {
    fields.push(`selected_avatar = $${index}`);
    values.push(selectedAvatar);
    index += 1;
  }
  if (!fields.length) {
    return getAccountProfile(userId);
  }

  values.push(userId);
  await query(
    `update public.profiles set ${fields.join(', ')}, updated_at = timezone('utc', now()) where id = $${index}`,
    values,
  );
  return getAccountProfile(userId);
}

export async function createWalletTransaction({ userId, requestId = null, tripId = null, type, amount, currency, status = 'completed', description = '', metadata = {} }) {
  const wallet = await queryOne(`select id, currency from public.wallet_accounts where user_id = $1`, [userId]);
  if (!wallet) return null;
  return queryOne(
    `
      insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      returning id
    `,
    [wallet.id, userId, requestId, tripId, type, amount, currency || wallet.currency || 'USD', status, description, metadata],
  );
}

export async function addWalletFunds({ userId, amount, description = 'Funds added', type = 'deposit', requestId = null, tripId = null }) {
  return withTransaction(async (client) => {
    const walletResult = await client.query(`select id, currency from public.wallet_accounts where user_id = $1 for update`, [userId]);
    const wallet = walletResult.rows[0];
    if (!wallet) throw new Error('Wallet not found');

    await client.query(
      `update public.wallet_accounts set available_balance = available_balance + $2, updated_at = timezone('utc', now()) where user_id = $1`,
      [userId, amount],
    );

    await client.query(
      `
        insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
        values ($1,$2,$3,$4,$5,$6,$7,'completed',$8,$9)
      `,
      [wallet.id, userId, requestId, tripId, type, amount, wallet.currency || 'USD', description, {}],
    );

    return getWalletByUserId(userId);
  });
}

export async function moveFundsToEscrow({ userId, amount, description = 'Funds moved to escrow', requestId = null, tripId = null }) {
  return withTransaction(async (client) => {
    const walletResult = await client.query(`select id, available_balance, escrow_balance, currency from public.wallet_accounts where user_id = $1 for update`, [userId]);
    const wallet = walletResult.rows[0];
    if (!wallet) throw new Error('Wallet not found');
    if (toNumber(wallet.available_balance) < amount) throw new Error('Insufficient wallet balance');

    await client.query(
      `
        update public.wallet_accounts
        set available_balance = available_balance - $2,
            escrow_balance = escrow_balance + $2,
            updated_at = timezone('utc', now())
        where user_id = $1
      `,
      [userId, amount],
    );

    await client.query(
      `insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
       values ($1,$2,$3,$4,'escrow_hold',$5,$6,'completed',$7,$8)`,
      [wallet.id, userId, requestId, tripId, amount, wallet.currency || 'USD', description, {}],
    );

    return getWalletByUserId(userId);
  });
}

export async function releaseEscrowFunds({ userId, amount, description = 'Funds released from escrow', requestId = null, tripId = null }) {
  return withTransaction(async (client) => {
    const walletResult = await client.query(`select id, available_balance, escrow_balance, currency from public.wallet_accounts where user_id = $1 for update`, [userId]);
    const wallet = walletResult.rows[0];
    if (!wallet) throw new Error('Wallet not found');
    if (toNumber(wallet.escrow_balance) < amount) throw new Error('Insufficient escrow balance');

    await client.query(
      `
        update public.wallet_accounts
        set escrow_balance = escrow_balance - $2,
            available_balance = available_balance + $2,
            updated_at = timezone('utc', now())
        where user_id = $1
      `,
      [userId, amount],
    );

    await client.query(
      `insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
       values ($1,$2,$3,$4,'escrow_release',$5,$6,'completed',$7,$8)`,
      [wallet.id, userId, requestId, tripId, amount, wallet.currency || 'USD', description, {}],
    );

    return getWalletByUserId(userId);
  });
}

export async function deductWalletFunds({ userId, amount, description = 'Withdrawal', requestId = null, tripId = null, metadata = {} }) {
  return withTransaction(async (client) => {
    const walletResult = await client.query(`select id, available_balance, currency from public.wallet_accounts where user_id = $1 for update`, [userId]);
    const wallet = walletResult.rows[0];
    if (!wallet) throw new Error('Wallet not found');
    if (toNumber(wallet.available_balance) < amount) throw new Error('Insufficient balance');

    await client.query(
      `update public.wallet_accounts set available_balance = available_balance - $2, updated_at = timezone('utc', now()) where user_id = $1`,
      [userId, amount],
    );

    await client.query(
      `insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
       values ($1,$2,$3,$4,'withdrawal',$5,$6,'completed',$7,$8)`,
      [wallet.id, userId, requestId, tripId, amount, wallet.currency || 'USD', description, metadata],
    );

    return getWalletByUserId(userId);
  });
}

export async function listWithdrawalTransactions() {
  return query(
    `
      select
        wt.id,
        wt.user_id,
        p.first_name,
        p.last_name,
        p.email,
        wt.amount,
        wt.status,
        wt.created_at,
        wt.description,
        wt.currency,
        wt.metadata
      from public.wallet_transactions wt
      join public.profiles p on p.id = wt.user_id
      where wt.type = 'withdrawal'
      order by wt.created_at desc
    `,
  );
}

export async function updateWithdrawalTransactionStatus({ transactionId, status, failureReason = '' }) {
  return withTransaction(async (client) => {
    const transactionResult = await client.query(
      `
        select wt.id, wt.user_id, wt.amount, wt.currency, wt.status, wt.description, wt.metadata, wa.id as wallet_id
        from public.wallet_transactions wt
        join public.wallet_accounts wa on wa.user_id = wt.user_id
        where wt.id = $1 and wt.type = 'withdrawal'
        for update
      `,
      [transactionId],
    );

    const transaction = transactionResult.rows[0];
    if (!transaction) return null;

    if (!['completed', 'failed', 'pending'].includes(status)) {
      throw new Error('Invalid status');
    }

    const nextMetadata = {
      ...(transaction.metadata || {}),
      ...(failureReason ? { failureReason } : {}),
      reviewedAt: new Date().toISOString(),
    };

    if (transaction.status === 'pending' && status === 'failed') {
      await client.query(
        `
          update public.wallet_accounts
          set available_balance = available_balance + $2,
              updated_at = timezone('utc', now())
          where user_id = $1
        `,
        [transaction.user_id, transaction.amount],
      );

      await client.query(
        `
          insert into public.wallet_transactions (wallet_id, user_id, type, amount, currency, status, description, metadata)
          values ($1, $2, 'refund', $3, $4, 'completed', $5, $6)
        `,
        [
          transaction.wallet_id,
          transaction.user_id,
          transaction.amount,
          transaction.currency || 'USD',
          `Refund for failed withdrawal ${transaction.id}`,
          { sourceTransactionId: transaction.id, reason: failureReason || 'Withdrawal failed' },
        ],
      );
    }

    await client.query(
      `
        update public.wallet_transactions
        set status = $2,
            description = $3,
            metadata = $4
        where id = $1
      `,
      [
        transactionId,
        status,
        failureReason ? `${transaction.description || 'Withdrawal'} (Failed: ${failureReason})` : transaction.description,
        nextMetadata,
      ],
    );

    return queryOne(
      `
        select id, user_id, amount, currency, status, description, metadata, created_at
        from public.wallet_transactions
        where id = $1
      `,
      [transactionId],
    );
  });
}

export async function holdEscrowForPaidRequest({ requestId, providerReference, provider = 'paystack' }) {
  return withTransaction(async (client) => {
    await ensurePaymentEventsInfrastructure(client);

    // Fetch request with package weight
    const requestResult = await client.query(
      `
        select 
          sr.id, sr.sender_id, sr.traveler_id, sr.trip_id, sr.amount, sr.currency,
          sr.tracking_number, sr.payment_info, sr.insurance_cost, p.package_weight
        from public.shipment_requests sr
        join public.packages p on p.id = sr.package_id
        where sr.id = $1 for update
      `,
      [requestId],
    );
    const request = requestResult.rows[0];
    if (!request) return null;

    const existingEscrowTransaction = await client.query(
      `
        select id
        from public.wallet_transactions
        where request_id = $1
          and user_id = $2
          and type = 'escrow_hold'
        limit 1
      `,
      [requestId, request.traveler_id],
    );

    if (existingEscrowTransaction.rows[0]?.id) {
      return request;
    }

    try {
      await client.query(
        `
          insert into public.payment_events (provider, event_type, provider_reference, request_id, payload)
          values ($1, $2, $3, $4, $5)
          on conflict (provider, event_type, provider_reference) do nothing
        `,
        [provider, 'payment_confirmed', providerReference, requestId, { requestId, providerReference }],
      );
    } catch (error) {
      console.warn('Payment confirmation event logging failed, continuing:', error.message);
    }

    await client.query(
      `update public.shipment_requests set payment_info = $2, updated_at = timezone('utc', now()) where id = $1`,
      [requestId, { method: provider, status: 'paid', requestId: providerReference, gateway: provider }],
    );

    const walletResult = await client.query(`select id, currency from public.wallet_accounts where user_id = $1 for update`, [request.traveler_id]);
    const wallet = walletResult.rows[0];
    if (wallet) {
      const requestCurrency = (request.currency || 'USD').toUpperCase();
      const walletCurrency = (wallet.currency || 'USD').toUpperCase();
      const rawAmount = toNumber(request.amount);
      const commissionAmount = Number((rawAmount * getCommissionRate()).toFixed(2));
      const insuranceFee = toNumber(request.insurance_cost);
      const travelerEarningAmount = Math.max(0, rawAmount - commissionAmount - insuranceFee);
      const escrowAmount = requestCurrency !== walletCurrency
        ? await convertCurrency(travelerEarningAmount, requestCurrency, walletCurrency)
        : travelerEarningAmount;
      const exchangeRate = travelerEarningAmount > 0 ? escrowAmount / travelerEarningAmount : 1;

      await upsertShipmentLedger(client, {
        request,
        provider,
        providerReference,
        walletCurrency,
        convertedTravelerEarning: escrowAmount,
        commissionAmount,
        insuranceFee,
        exchangeRate,
        travelerEarningAmount,
      });

      await client.query(
        `update public.wallet_accounts set escrow_balance = escrow_balance + $2, updated_at = timezone('utc', now()) where user_id = $1`,
        [request.traveler_id, escrowAmount],
      );
      await client.query(
        `insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
         values ($1,$2,$3,$4,'escrow_hold',$5,$6,'completed',$7,$8)`,
        [wallet.id, request.traveler_id, request.id, request.trip_id, escrowAmount, walletCurrency, `Escrow hold for Request ${request.tracking_number || request.id}`, { providerReference, provider, originalAmount: rawAmount, originalCurrency: requestCurrency, commissionAmount, insuranceFee, travelerEarningAmount }],
      );
    }

    return request;
  });
}

export async function storePendingBankVerification(userId, details, otpCode, expiresAt) {
  const profile = await getAccountProfile(userId);
  const currentDetails = profile?.bankDetails || {};
  const bankDetails = {
    ...currentDetails,
    pending_bank_verification: {
      otpCode,
      expiresAt: expiresAt.toISOString(),
      details,
    },
  };
  await updateAccountProfile(userId, { bankDetails });
  return getAccountProfile(userId);
}

export async function getPendingBankVerification(userId) {
  const profile = await getAccountProfile(userId);
  return profile?.bankDetails?.pending_bank_verification || null;
}

export async function finalizeBankVerification(userId, { recipientCode, bankName, accountNumber, accountHolderName }) {
  const profile = await getAccountProfile(userId);
  const currentDetails = profile?.bankDetails || {};
  const bankDetails = {
    ...currentDetails,
    bankName,
    accountNumber,
    accountHolderName,
  };
  delete bankDetails.pending_bank_verification;

  await query(
    `update public.profiles
     set paystack_recipient_code = $2,
         bank_details = $3,
         payout_provider = 'paystack',
         payout_method_status = 'connected',
         updated_at = timezone('utc', now())
     where id = $1`,
    [userId, recipientCode, bankDetails],
  );
  return getAccountProfile(userId);
}

export async function getKycRecord(userId) {
  const kyc = await queryOne(
    `select * from public.kyc_verifications where user_id = $1 order by created_at desc limit 1`,
    [userId],
  );
  const user = await getAccountProfile(userId);
  return { kyc, user };
}

export async function upsertKycSession(userId, { sessionId, sessionToken, status = 'pending' }) {
  await query(
    `
      update public.profiles
      set didit_session_id = $2,
          didit_session_token = $3,
          kyc_status = $4,
          updated_at = timezone('utc', now())
      where id = $1
    `,
    [userId, sessionId, sessionToken, status],
  );

  // Keep exactly one row per user — update if exists, insert if not
  const existing = await queryOne(`select id from public.kyc_verifications where user_id = $1`, [userId]);
  if (existing) {
    await query(
      `
        update public.kyc_verifications
        set didit_session_id = $2,
            status = $3,
            updated_at = timezone('utc', now())
        where user_id = $1
      `,
      [userId, sessionId, status],
    );
  } else {
    await query(
      `insert into public.kyc_verifications (user_id, didit_session_id, status) values ($1, $2, $3)`,
      [userId, sessionId, status],
    );
  }

  return getKycRecord(userId);
}

export async function markKycApproved(userId, payload = {}) {
  return withTransaction(async (client) => {
    const fullPayload = payload.kycVerifiedData || payload;
    const candidate = fullPayload?.data?.entity || fullPayload?.data || fullPayload?.entity || fullPayload || {};
    const firstName = payload.firstName || candidate.first_name || candidate.firstName || candidate.firstname || null;
    const middleName = payload.middleName || candidate.middle_name || candidate.middleName || null;
    const lastName = payload.lastName || candidate.last_name || candidate.lastName || candidate.lastname || null;
    const fullLegalName = payload.fullLegalName ||
      candidate.full_name ||
      candidate.fullName ||
      [firstName, middleName, lastName].filter(Boolean).join(' ') ||
      null;
    const dateOfBirth = payload.dateOfBirth ||
      candidate.date_of_birth ||
      candidate.dateOfBirth ||
      candidate.dob ||
      null;
    const provider = payload.provider || fullPayload?.provider || fullPayload?.data?.provider || 'didit';

    await client.query(
      `
        update public.profiles
        set kyc_status = 'approved',
            status = 'verified',
            email_verified = true,
            kyc_verified_at = timezone('utc', now()),
            kyc_verified_data = $2,
            first_name = coalesce($3, first_name),
            last_name = coalesce($5, last_name),
            date_of_birth = coalesce($8, date_of_birth),
            verified_first_name = coalesce($3, verified_first_name),
            verified_middle_name = coalesce($4, verified_middle_name),
            verified_last_name = coalesce($5, verified_last_name),
            verified_full_legal_name = coalesce($6, verified_full_legal_name),
            verified_date_of_birth = coalesce($8::date, verified_date_of_birth),
            kyc_provider = $7,
            verification_provider = $7,
            identity_fields_locked = true,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [userId, fullPayload, firstName, middleName, lastName, fullLegalName, provider, dateOfBirth],
    );

    await client.query(
      `
        update public.kyc_verifications
        set status = 'approved',
            reviewed_at = timezone('utc', now()),
            review_notes = 'Approved via DIDIT',
            updated_at = timezone('utc', now())
        where user_id = $1
      `,
      [userId],
    );
  });
}
