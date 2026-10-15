// Compact server quote carried in Stripe metadata (each value has a 500-char limit).
export function encodeStripeQuote(quote) {
  return JSON.stringify({tc: quote.travelerCurrency, sc: quote.senderCurrency,
    tp: quote.travelerPayout, cp: quote.convertedTravelerPayout,
    pf: quote.platformFee, pc: quote.processingFee, fb: quote.fxBuffer,
    ss: quote.shippingAmount, ia: quote.insuranceAmount, ta: quote.totalAmount,
    br: quote.bagoNetRevenue, fx: quote.exchangeRate});
}

export function decodeStripeQuote(value) {
  try {
    const q = JSON.parse(value);
    const numbers = ['tp', 'cp', 'pf', 'pc', 'fb', 'ss', 'ia', 'ta', 'br', 'fx'];
    if (!/^[A-Z]{3}$/.test(q.tc) || !/^[A-Z]{3}$/.test(q.sc) ||
        numbers.some(k => !Number.isFinite(q[k]) || q[k] < 0) || q.ta <= 0 || q.fx <= 0 ||
        Math.abs(q.ss + q.ia - q.ta) > .011 ||
        Math.abs(q.cp + q.br - q.ss) > .011) return null;
    return {travelerCurrency: q.tc, senderCurrency: q.sc, travelerPayout: q.tp,
      convertedTravelerPayout: q.cp, platformFee: q.pf, processingFee: q.pc,
      fxBuffer: q.fb, shippingAmount: q.ss, insuranceAmount: q.ia,
      totalAmount: q.ta, bagoNetRevenue: q.br, exchangeRate: q.fx};
  } catch { return null; }
}

export function verifyStripeBookingIntent(intent, expected = {}) {
  if (intent.status !== 'succeeded') return {success: false, message: 'Payment has not completed.'};
  for (const key of ['senderId', 'packageId', 'tripId', 'travelerId']) {
    if (expected[key] && intent.metadata?.[key] !== String(expected[key])) {
      return {success: false, message: 'Payment does not belong to this booking.'};
    }
  }
  const quote = decodeStripeQuote(intent.metadata?.bago_quote);
  if (!quote || String(intent.currency).toUpperCase() !== quote.senderCurrency ||
      intent.amount !== Math.round(quote.totalAmount * 100) ||
      intent.amount_received !== intent.amount) {
    return {success: false, message: 'Payment amount or currency could not be verified.'};
  }
  return {success: true, data: {amount: intent.amount_received / 100,
    currency: quote.senderCurrency, status: intent.status, quote}};
}
