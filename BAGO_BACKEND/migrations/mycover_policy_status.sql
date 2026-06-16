ALTER TABLE public.shipment_requests
  ADD COLUMN IF NOT EXISTS insurance_policy_id TEXT,
  ADD COLUMN IF NOT EXISTS insurance_policy_data JSONB,
  ADD COLUMN IF NOT EXISTS insurance_status TEXT NOT NULL DEFAULT 'not_selected',
  ADD COLUMN IF NOT EXISTS insurance_error TEXT,
  ADD COLUMN IF NOT EXISTS insurance_purchased_at TIMESTAMPTZ;

UPDATE public.shipment_requests
SET insurance_status = CASE
  WHEN insurance IS NOT TRUE THEN 'not_selected'
  WHEN insurance_policy_id IS NOT NULL AND insurance_policy_id <> '' THEN 'active'
  WHEN insurance IS TRUE THEN 'pending_purchase'
  ELSE insurance_status
END
WHERE insurance_status IS NULL
   OR insurance_status = 'not_selected';
