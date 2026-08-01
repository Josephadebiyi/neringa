-- Mandatory open-box inspection evidence and neutral review statuses.
alter table public.shipment_requests
  add column if not exists inspection_data jsonb not null default '{}'::jsonb,
  add column if not exists inspection_started_at timestamptz,
  add column if not exists inspection_completed_at timestamptz,
  add column if not exists inspection_rejected_at timestamptz;

-- The startup migration runner extends legacy request_status enums with these
-- workflow values before executing this file. Replace the legacy CHECK
-- constraint when one exists in an installation.
alter table public.shipment_requests drop constraint if exists shipment_requests_status_check;
alter table public.shipment_requests
  add constraint shipment_requests_status_check check (status in (
    'pending',
    'accepted_awaiting_inspection',
    'inspection_in_progress',
    'inspection_completed',
    'rejected_at_inspection_under_review',
    'approved_for_trip',
    'intransit',
    'delivering',
    'completed',
    'refund_approved',
    'partial_refund_approved',
    'refund_declined',
    'cancelled',
    -- Backward compatibility for orders created before this workflow.
    'accepted',
    'rejected'
  ));

create index if not exists shipment_requests_inspection_review_idx
  on public.shipment_requests (status, inspection_rejected_at)
  where status = 'rejected_at_inspection_under_review';
