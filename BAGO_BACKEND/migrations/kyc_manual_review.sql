-- Add kyc_provider column to track which KYC flow was used (dojah, manual, didit)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_provider TEXT;

-- Index to quickly filter manual_review submissions in admin
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status_provider
  ON public.profiles (kyc_status, kyc_provider);
