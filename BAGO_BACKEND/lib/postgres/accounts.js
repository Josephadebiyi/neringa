import { query, queryOne, withTransaction } from './db.js';
import { findProfileById, getWalletByUserId } from './profiles.js';
import { convertCurrency } from '../../services/currencyConverter.js';

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
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
    const paymentEvent = await client.query(
      `
        insert into public.payment_events (provider, event_type, provider_reference, request_id, payload)
        values ($1, $2, $3, $4, $5)
        on conflict (provider, event_type, provider_reference) do nothing
        returning id
      `,
      [provider, 'payment_confirmed', providerReference, requestId, { requestId, providerReference }],
    );

    // Fetch request with package weight
    const requestResult = await client.query(
      `
        select 
          sr.id, sr.traveler_id, sr.trip_id, sr.amount, sr.currency, 
          sr.tracking_number, sr.payment_info, p.package_weight
        from public.shipment_requests sr
        join public.packages p on p.id = sr.package_id
        where sr.id = $1 for update
      `,
      [requestId],
    );
    const request = requestResult.rows[0];
    if (!request) return null;

    if (!paymentEvent.rows[0]?.id || request.payment_info?.status === 'paid') {
      return request;
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
      const escrowAmount = requestCurrency !== walletCurrency
        ? await convertCurrency(rawAmount, requestCurrency, walletCurrency)
        : rawAmount;

      await client.query(
        `update public.wallet_accounts set escrow_balance = escrow_balance + $2, updated_at = timezone('utc', now()) where user_id = $1`,
        [request.traveler_id, escrowAmount],
      );
      await client.query(
        `insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
         values ($1,$2,$3,$4,'escrow_hold',$5,$6,'completed',$7,$8)`,
        [wallet.id, request.traveler_id, request.id, request.trip_id, escrowAmount, walletCurrency, `Escrow hold for Request ${request.tracking_number || request.id}`, { providerReference, provider, originalAmount: rawAmount, originalCurrency: requestCurrency }],
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
    `update public.profiles set paystack_recipient_code = $2, bank_details = $3, updated_at = timezone('utc', now()) where id = $1`,
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
    const firstName = payload.firstName || null;
    const lastName = payload.lastName || null;
    const dateOfBirth = payload.dateOfBirth || null;
    const fullPayload = payload.kycVerifiedData || payload;

    await client.query(
      `
        update public.profiles
        set kyc_status = 'approved',
            status = 'verified',
            email_verified = true,
            kyc_verified_at = timezone('utc', now()),
            kyc_verified_data = $2,
            first_name = coalesce($3, first_name),
            last_name = coalesce($4, last_name),
            date_of_birth = coalesce($5, date_of_birth),
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [userId, fullPayload, firstName, lastName, dateOfBirth],
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
