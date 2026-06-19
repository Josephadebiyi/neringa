ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS payout_otp_hash TEXT,
  ADD COLUMN IF NOT EXISTS payout_otp_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS profiles_payout_otp_expires_idx
  ON public.profiles (payout_otp_expires_at)
  WHERE payout_otp_hash IS NOT NULL;
