-- Cleanup for accidental duplicate withdrawal requests and stale shipment rows
-- that were created without a real paid/active status. This keeps an audit trail
-- by cancelling rows instead of deleting financial or shipment records.

WITH duplicate_wallet_withdrawals AS (
  SELECT id, wallet_id, amount
  FROM (
    SELECT
      id,
      wallet_id,
      amount,
      row_number() OVER (
        PARTITION BY
          user_id,
          amount,
          currency,
          lower(coalesce(status::text, 'pending')),
          coalesce(metadata ->> 'provider', metadata ->> 'method', ''),
          date_trunc('minute', created_at)
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM public.wallet_transactions
    WHERE type = 'withdrawal'
      AND lower(coalesce(status::text, 'pending')) IN ('pending', 'processing', 'approved')
      AND coalesce(metadata ->> 'duplicateCleared', 'false') <> 'true'
  ) ranked
  WHERE rn > 1
),
cancelled_wallet_withdrawals AS (
  UPDATE public.wallet_transactions wt
  SET status = 'cancelled',
      metadata = coalesce(wt.metadata, '{}'::jsonb) || jsonb_build_object(
        'duplicateCleared', true,
        'duplicateClearedAt', timezone('utc', now()),
        'duplicateClearReason', 'same user, amount, currency, provider and minute bucket'
      ),
      updated_at = timezone('utc', now())
  FROM duplicate_wallet_withdrawals d
  WHERE wt.id = d.id
  RETURNING d.wallet_id, d.amount
),
wallet_refunds AS (
  SELECT wallet_id, sum(amount) AS amount
  FROM cancelled_wallet_withdrawals
  WHERE wallet_id IS NOT NULL
  GROUP BY wallet_id
)
UPDATE public.wallet_accounts wa
SET available_balance = wa.available_balance + wallet_refunds.amount,
    updated_at = timezone('utc', now())
FROM wallet_refunds
WHERE wa.id = wallet_refunds.wallet_id;

WITH duplicate_paystack_withdrawals AS (
  SELECT id, user_id, amount, currency
  FROM (
    SELECT
      id,
      user_id,
      amount,
      currency,
      row_number() OVER (
        PARTITION BY
          user_id,
          amount,
          currency,
          lower(coalesce(status::text, 'pending')),
          date_trunc('minute', created_at)
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM public.paystack_pending_withdrawals
    WHERE lower(coalesce(status::text, 'pending')) IN ('pending', 'processing', 'approved')
  ) ranked
  WHERE rn > 1
),
cancelled_paystack_withdrawals AS (
  UPDATE public.paystack_pending_withdrawals ppw
  SET status = 'cancelled',
      updated_at = timezone('utc', now())
  FROM duplicate_paystack_withdrawals d
  WHERE ppw.id = d.id
  RETURNING d.user_id, d.amount, d.currency
),
profile_refunds AS (
  SELECT
    user_id,
    coalesce(nullif(currency, ''), 'USD') AS currency,
    sum(amount) AS amount
  FROM cancelled_paystack_withdrawals
  GROUP BY user_id, coalesce(nullif(currency, ''), 'USD')
),
created_wallets AS (
  INSERT INTO public.wallet_accounts (user_id, available_balance, escrow_balance, currency)
  SELECT pr.user_id, 0, 0, pr.currency
  FROM profile_refunds pr
  WHERE NOT EXISTS (
    SELECT 1 FROM public.wallet_accounts existing WHERE existing.user_id = pr.user_id
  )
  RETURNING user_id
)
UPDATE public.wallet_accounts wa
SET available_balance = wa.available_balance + profile_refunds.amount,
    updated_at = timezone('utc', now())
FROM profile_refunds
WHERE wa.user_id = profile_refunds.user_id;

UPDATE public.shipment_requests sr
SET status = 'cancelled',
    payment_info = coalesce(sr.payment_info, '{}'::jsonb) || jsonb_build_object(
      'adminClearedInvalid', true,
      'clearedReason', 'invalid_or_unpaid_status',
      'clearedAt', timezone('utc', now()),
      'previousStatus', sr.status::text
    ),
    updated_at = timezone('utc', now())
WHERE coalesce(sr.payment_info ->> 'adminClearedInvalid', 'false') <> 'true'
  AND sr.created_at < timezone('utc', now()) - interval '30 minutes'
  AND (
    sr.status IS NULL
    OR trim(sr.status::text) = ''
    OR lower(sr.status::text) IN ('draft', 'pending_payment', 'payment_pending', 'unpaid')
    OR (
      lower(sr.status::text) = 'pending'
      AND lower(coalesce(sr.payment_status::text, '')) NOT IN ('paid', 'paid_escrow', 'authorized', 'captured', 'released')
      AND lower(coalesce(sr.payment_info ->> 'status', '')) NOT IN ('paid', 'paid_escrow', 'authorized', 'captured', 'released')
    )
  );
