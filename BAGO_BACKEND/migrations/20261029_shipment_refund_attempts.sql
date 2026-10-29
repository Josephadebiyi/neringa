-- One durable reservation per original processor payment. No cascading FK:
-- deleting a shipment must never remove its duplicate-refund protection.
-- The backend also initializes this table under a schema advisory lock.
CREATE TABLE IF NOT EXISTS public.shipment_refund_attempts (
  provider text NOT NULL,
  payment_reference text NOT NULL,
  request_id uuid NOT NULL,
  refund_info jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, payment_reference)
);
ALTER TABLE public.shipment_refund_attempts ENABLE ROW LEVEL SECURITY;
