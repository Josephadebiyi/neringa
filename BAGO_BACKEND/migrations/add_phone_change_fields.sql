ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS pending_phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_change_otp_code TEXT,
  ADD COLUMN IF NOT EXISTS phone_change_otp_expires_at TIMESTAMPTZ;
