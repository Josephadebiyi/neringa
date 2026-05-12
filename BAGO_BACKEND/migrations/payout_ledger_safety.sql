ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_country text,
  ADD COLUMN IF NOT EXISTS payout_provider text,
  ADD COLUMN IF NOT EXISTS payout_method_status text NOT NULL DEFAULT 'not_connected',
  ADD COLUMN IF NOT EXISTS stripe_onboarding_status text,
  ADD COLUMN IF NOT EXISTS stripe_charges_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paypal_email text,
  ADD COLUMN IF NOT EXISTS paypal_payout_status text,
  ADD COLUMN IF NOT EXISTS verified_first_name text,
  ADD COLUMN IF NOT EXISTS verified_middle_name text,
  ADD COLUMN IF NOT EXISTS verified_last_name text,
  ADD COLUMN IF NOT EXISTS verified_full_legal_name text,
  ADD COLUMN IF NOT EXISTS verified_date_of_birth date,
  ADD COLUMN IF NOT EXISTS verification_provider text,
  ADD COLUMN IF NOT EXISTS identity_fields_locked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payout_currency_change_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS payout_currency_change_request jsonb;

UPDATE public.profiles
SET earning_currency_locked = FALSE
WHERE earning_currency_locked IS TRUE;

CREATE TABLE IF NOT EXISTS public.shipment_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL REFERENCES public.shipment_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  traveler_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_provider text NOT NULL,
  payment_reference text,
  payment_currency text NOT NULL,
  payment_amount numeric(14,2) NOT NULL DEFAULT 0,
  bago_commission_amount numeric(14,2) NOT NULL DEFAULT 0,
  payment_processing_fee numeric(14,2) NOT NULL DEFAULT 0,
  insurance_fee numeric(14,2) NOT NULL DEFAULT 0,
  currency_conversion_fee_or_margin numeric(14,2) NOT NULL DEFAULT 0,
  traveler_earning_amount numeric(14,2) NOT NULL DEFAULT 0,
  traveler_wallet_currency text NOT NULL,
  exchange_rate_used numeric(20,8) NOT NULL DEFAULT 1,
  converted_traveler_earning numeric(14,2) NOT NULL DEFAULT 0,
  escrow_status text NOT NULL DEFAULT 'held',
  payout_status text NOT NULL DEFAULT 'not_available',
  wallet_credit_created boolean NOT NULL DEFAULT false,
  provider_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS shipment_ledgers_shipment_id_key
  ON public.shipment_ledgers (shipment_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'wallet_transaction_type'
      AND e.enumlabel = 'earning'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_one_earning_per_request_user
      ON public.wallet_transactions (request_id, user_id)
      WHERE type = ''earning'' AND request_id IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'wallet_transaction_type'
      AND e.enumlabel = 'escrow_hold'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_one_escrow_hold_per_request_user
      ON public.wallet_transactions (request_id, user_id)
      WHERE type = ''escrow_hold'' AND request_id IS NOT NULL';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'wallet_transaction_type'
      AND e.enumlabel = 'withdrawal'
  ) THEN
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS wallet_transactions_withdrawal_reference_key
      ON public.wallet_transactions ((metadata->>''reference''))
      WHERE type = ''withdrawal'' AND metadata ? ''reference''';
  END IF;
END $$;
