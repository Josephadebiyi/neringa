-- Adds a 4-digit handover PIN to shipment_requests.
-- Sender/Receiver sees the PIN; the authenticated traveler enters it in their app
-- to trigger automatic escrow release without waiting for sender confirmation.

ALTER TABLE public.shipment_requests
  ADD COLUMN IF NOT EXISTS handover_pin          CHAR(4),
  ADD COLUMN IF NOT EXISTS handover_pin_used      BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS handover_pin_used_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS handover_pin_attempts  SMALLINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_shipment_requests_handover_pin
  ON public.shipment_requests (handover_pin)
  WHERE handover_pin IS NOT NULL;
