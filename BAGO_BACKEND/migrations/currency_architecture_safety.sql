CREATE TABLE IF NOT EXISTS public.exchange_rates (
  base_currency text PRIMARY KEY,
  rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'unknown',
  last_updated timestamptz NOT NULL DEFAULT timezone('utc', now()),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.exchange_rates
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT timezone('utc', now());

CREATE TABLE IF NOT EXISTS public.exchange_rate_logs (
  id bigserial PRIMARY KEY,
  provider text NOT NULL,
  base_currency text NOT NULL,
  status text NOT NULL,
  message text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS exchange_rate_logs_created_at_idx
  ON public.exchange_rate_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS public.currency_conversion_audit_logs (
  id bigserial PRIMARY KEY,
  from_currency text NOT NULL,
  to_currency text NOT NULL,
  amount_minor bigint NOT NULL,
  converted_amount_minor bigint NOT NULL,
  exchange_rate numeric(24,12) NOT NULL,
  exchange_rate_source text NOT NULL,
  exchange_rate_timestamp timestamptz NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS currency_conversion_audit_logs_created_at_idx
  ON public.currency_conversion_audit_logs (created_at DESC);

ALTER TABLE public.payment_events
  ADD COLUMN IF NOT EXISTS expected_amount_minor bigint,
  ADD COLUMN IF NOT EXISTS expected_currency text,
  ADD COLUMN IF NOT EXISTS provider_amount_minor bigint,
  ADD COLUMN IF NOT EXISTS provider_currency text,
  ADD COLUMN IF NOT EXISTS reconciliation_status text,
  ADD COLUMN IF NOT EXISTS reconciliation_error text;

ALTER TABLE public.shipment_ledgers
  ADD COLUMN IF NOT EXISTS original_amount_minor bigint,
  ADD COLUMN IF NOT EXISTS original_currency text,
  ADD COLUMN IF NOT EXISTS converted_amount_minor bigint,
  ADD COLUMN IF NOT EXISTS converted_currency text,
  ADD COLUMN IF NOT EXISTS exchange_rate_source text,
  ADD COLUMN IF NOT EXISTS exchange_rate_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS provider_amount_minor bigint,
  ADD COLUMN IF NOT EXISTS provider_currency text,
  ADD COLUMN IF NOT EXISTS payout_currency text,
  ADD COLUMN IF NOT EXISTS withdrawal_fee_minor bigint NOT NULL DEFAULT 0;

ALTER TABLE public.paypal_payments
  ADD COLUMN IF NOT EXISTS original_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS original_currency text,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(24,12),
  ADD COLUMN IF NOT EXISTS exchange_rate_source text,
  ADD COLUMN IF NOT EXISTS exchange_rate_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS provider_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS provider_currency text;

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS original_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS original_currency text,
  ADD COLUMN IF NOT EXISTS converted_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS converted_currency text,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric(24,12),
  ADD COLUMN IF NOT EXISTS exchange_rate_source text,
  ADD COLUMN IF NOT EXISTS exchange_rate_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS provider_amount numeric(14,2),
  ADD COLUMN IF NOT EXISTS provider_currency text,
  ADD COLUMN IF NOT EXISTS payout_currency text;
