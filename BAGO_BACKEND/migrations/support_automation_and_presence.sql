-- Support automation, SLA tracking, internal notes, saved replies, and staff presence.
-- Safe to re-run.

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS assistant_state TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (assistant_state IN ('ACTIVE', 'HANDOFF', 'DISABLED')),
  ADD COLUMN IF NOT EXISTS first_agent_response_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_agent_response_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS internal_notes JSONB NOT NULL DEFAULT '[]';

UPDATE public.support_tickets
SET first_agent_response_due_at = COALESCE(first_agent_response_due_at, created_at + INTERVAL '24 hours'),
    assistant_state = COALESCE(assistant_state, 'ACTIVE')
WHERE first_agent_response_due_at IS NULL
   OR assistant_state IS NULL;

ALTER TABLE public.admin_users
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS support_presence TEXT NOT NULL DEFAULT 'OFFLINE'
    CHECK (support_presence IN ('OFFLINE', 'AWAY', 'AVAILABLE')),
  ADD COLUMN IF NOT EXISTS support_last_seen_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.support_saved_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS support_saved_replies_active_idx
  ON public.support_saved_replies(is_active, created_at DESC);

INSERT INTO public.support_saved_replies (title, body, is_active)
SELECT *
FROM (
  VALUES
    (
      'Warm acknowledgment',
      'Thanks for reaching out to Bago support. I am reviewing this now and will keep this conversation updated.',
      TRUE
    ),
    (
      'Waiting for handoff',
      'A support teammate is not immediately available, but your ticket is in our queue and we will respond within 24 hours.',
      TRUE
    ),
    (
      'Shipment coordination',
      'I am checking the shipment details and coordinating with the relevant team. I will update you here as soon as I have the next step.',
      TRUE
    )
) AS seed(title, body, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.support_saved_replies existing WHERE existing.title = seed.title
);
