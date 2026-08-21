ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_grace_period_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_grace_reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_restricted_notified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS business_document_rejection_reason TEXT;
