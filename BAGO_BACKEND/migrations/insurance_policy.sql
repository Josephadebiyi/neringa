-- Add MyCover.ai policy tracking columns to shipment_requests
ALTER TABLE public.shipment_requests
  ADD COLUMN IF NOT EXISTS insurance_policy_id TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy_data JSONB;
