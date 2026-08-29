-- Adds the granular business delivery-workflow statuses (Package Received,
-- Delivery Started, Arrived at Hub) alongside the existing coarse statuses —
-- 'intransit' and 'delivering' already cover In Transit / Out for Delivery.
-- The startup migration runner extends legacy request_status enums with
-- these values (see server.js ensureRequestStatusEnumValues) before this
-- file runs.
ALTER TABLE public.shipment_requests DROP CONSTRAINT IF EXISTS shipment_requests_status_check;
ALTER TABLE public.shipment_requests
  ADD CONSTRAINT shipment_requests_status_check CHECK (status IN (
    'pending',
    'accepted_awaiting_inspection',
    'inspection_in_progress',
    'inspection_completed',
    'rejected_at_inspection_under_review',
    'approved_for_trip',
    'package_received',
    'delivery_started',
    'intransit',
    'arrived_at_hub',
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
