-- Secondary/external carrier tracking reference on a shipment, in addition to
-- (never instead of) the Bago tracking number. "carrier" already means "the
-- Bago traveler" elsewhere in this codebase (see shipping.js carrierId/
-- carrierName), so these columns are deliberately prefixed external_ to avoid
-- colliding with that meaning.
ALTER TABLE public.shipment_requests
  ADD COLUMN IF NOT EXISTS external_carrier TEXT,
  ADD COLUMN IF NOT EXISTS external_carrier_custom_name TEXT,
  ADD COLUMN IF NOT EXISTS external_tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS external_tracking_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shipment_requests_external_carrier_check') THEN
    ALTER TABLE public.shipment_requests ADD CONSTRAINT shipment_requests_external_carrier_check
      CHECK (external_carrier IS NULL OR external_carrier IN ('dhl', 'fedex', 'ups', 'gig', 'other'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS shipment_requests_external_tracking_idx
  ON public.shipment_requests (external_tracking_number)
  WHERE external_tracking_number IS NOT NULL;
