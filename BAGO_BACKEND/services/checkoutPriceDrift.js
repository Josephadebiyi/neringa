// Checkout totals are quoted with the FX rate at preview time, and rates
// re-sync every 10 minutes. A sender who pays a few minutes later would
// otherwise be rejected for a cent-level FX move. Within this tolerance we
// charge the amount the sender was shown and Bago's margin absorbs the drift.
export const CHECKOUT_PRICE_DRIFT_TOLERANCE = Number(process.env.CHECKOUT_PRICE_DRIFT_TOLERANCE || 0.03);

const round2 = (value) => Number(Number(value).toFixed(2));

// Returns the quote rebased onto `requestedAmount`, or null when the sender's
// amount is too far from the fresh quote (or would eat into the traveler payout).
export function acceptQuotedAmount(quote, requestedAmount) {
  const requested = Number(requestedAmount);
  const fresh = Number(quote?.totalAmount);
  if (!Number.isFinite(requested) || requested <= 0 || !Number.isFinite(fresh) || fresh <= 0) return null;
  const delta = round2(requested - fresh);
  if (Math.abs(delta) <= 0.011) return quote;
  if (Math.abs(delta) > fresh * CHECKOUT_PRICE_DRIFT_TOLERANCE) return null;

  const shippingAmount = round2(Number(quote.shippingAmount ?? fresh) + delta);
  const bagoNetRevenue = round2(Number(quote.bagoNetRevenue ?? 0) + delta);
  if (shippingAmount <= 0 || bagoNetRevenue < 0) return null;
  return {
    ...quote,
    shippingAmount,
    bagoNetRevenue,
    totalAmount: round2(requested),
    priceDriftAbsorbed: delta,
    freshTotalAmount: fresh,
  };
}
