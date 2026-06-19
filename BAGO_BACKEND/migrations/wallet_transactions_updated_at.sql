ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now());

UPDATE public.wallet_transactions
SET updated_at = COALESCE(updated_at, created_at, timezone('utc', now()))
WHERE updated_at IS NULL;
