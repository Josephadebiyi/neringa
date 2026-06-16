CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.operational_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  status TEXT,
  previous_status TEXT,
  actor_user_id UUID,
  sender_id UUID,
  traveler_id UUID,
  package_id UUID,
  trip_id UUID,
  amount NUMERIC,
  currency TEXT,
  item_category TEXT,
  item_description TEXT,
  package_weight NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS operational_records_entity_idx
  ON public.operational_records (entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_records_request_idx
  ON public.operational_records (entity_id, created_at DESC)
  WHERE entity_type = 'shipment_request';

CREATE INDEX IF NOT EXISTS operational_records_trip_idx
  ON public.operational_records (trip_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_records_package_idx
  ON public.operational_records (package_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_records_user_idx
  ON public.operational_records (sender_id, traveler_id, created_at DESC);
