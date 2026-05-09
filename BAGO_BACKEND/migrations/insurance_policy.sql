-- Add MyCover.ai policy tracking columns to requests
ALTER TABLE public.requests
  ADD COLUMN IF NOT EXISTS insurance_policy_id TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy_data JSONB;
