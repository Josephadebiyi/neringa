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
 * The traveler's own view of a request. Their earning is what the sender paid
 * minus insurance and Bago's fees, in the traveler's wallet currency
 * (`earning`, from getTravelerEarningForRequest). Apps label every amount with
 * `currency`, so the view uses the earning's currency and converts the
 * insurance figure to match. The sender's currency stays in paymentCurrency.
 */
export async function forTravelerView(request, { earning, convert }) {
  if (!request || typeof request !== 'object') return request;
  const paymentCurrency = String(request.currency || '').toUpperCase();
  const view = { ...request, paymentCurrency: request.currency, paymentAmount: request.amount };
  if (!earning) return view;
  const earningCurrency = String(earning.currency || paymentCurrency).toUpperCase();
  view.travelerPayout = earning.amount;
  view.travelerPayoutCurrency = earningCurrency;
  view.currency = earningCurrency;
  const insuranceCost = Number(request.insuranceCost) || 0;
  if (insuranceCost > 0 && paymentCurrency && earningCurrency !== paymentCurrency) {
    try {
      view.insuranceCost = Number((await convert(insuranceCost, paymentCurrency, earningCurrency)).toFixed(2));
    } catch {
      view.insuranceCost = 0;
    }
  }
  return view;
}
