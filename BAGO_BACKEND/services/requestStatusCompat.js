// Released mobile apps (1.0.9) only show the traveler's "Update Shipment Status"
// card and the handover PIN when a request's status is exactly 'accepted'. The
// backend stores the inspection stages separately, so travelers saw
// "Accepted — Awaiting Package Inspection" with no way to start shipping.
// Report those stages to the apps as 'accepted'; the real value stays in
// `workflowStatus` for clients that understand it.
const SHOWN_AS_ACCEPTED = new Set([
  'accepted_awaiting_inspection',
  'inspection_in_progress',
  'inspection_completed',
  'approved_for_trip',
]);

export function clientRequestStatus(status) {
  return SHOWN_AS_ACCEPTED.has(status) ? 'accepted' : status;
}

export function withClientStatus(request) {
  if (!request || typeof request !== 'object') return request;
  return { ...request, status: clientRequestStatus(request.status), workflowStatus: request.status };
}
