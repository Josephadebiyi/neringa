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

/**
 * The traveler's earning (travelerPayout) is in the trip's currency, but apps
 * label every amount with `currency`, which is what the SENDER paid in. A
 * Lagos trip priced in NGN booked by a sender paying EUR showed
 * "Your earning EUR 89750.00" instead of "NGN 89750.00". For the traveler's
 * own view, label the request with the payout currency and convert the
 * insurance figure to match. The sender's currency stays in paymentCurrency.
 */
export async function forTravelerView(request, convert) {
  if (!request || typeof request !== 'object') return request;
  const payoutCurrency = String(request.travelerPayoutCurrency || request.currency || '').toUpperCase();
  const paymentCurrency = String(request.currency || '').toUpperCase();
  const view = { ...request, paymentCurrency: request.currency, paymentAmount: request.amount };
  if (!payoutCurrency || !paymentCurrency || payoutCurrency === paymentCurrency) return view;
  view.currency = payoutCurrency;
  const insuranceCost = Number(request.insuranceCost) || 0;
  if (insuranceCost > 0) {
    try {
      view.insuranceCost = Number((await convert(insuranceCost, paymentCurrency, payoutCurrency)).toFixed(2));
    } catch {
      view.insuranceCost = 0;
    }
  }
  return view;
}
