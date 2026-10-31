import { getFullPricingConfig } from './pricingService.js';

// Business rule: the traveler earns what the sender paid, minus insurance and
// Bago's fees (platform commission, processing fee, FX buffer), converted from
// the sender's payment currency into the traveler's wallet currency. Admin
// handles the withdrawal/payout from that wallet.

export async function getSurchargeMultiplier() {
  let config = {};
  try {
    config = (await getFullPricingConfig()) || {};
  } catch {
    config = {};
  }
  return (1 + Number(config.platformCommissionPercent ?? 15) / 100)
    * (1 + Number(config.processingFeePercent || 0) / 100 + Number(config.fxBufferPercent || 0) / 100);
}

/**
 * Traveler's share of an amount paid, still in the payment currency.
 * Uses the fees actually charged on the booking (stored in the payment
 * currency at checkout) when known; otherwise removes the configured fee rate.
 */
export function netForTraveler({ amountPaid, insuranceCost = 0, fees = null, multiplier = 1 }) {
  const paid = Number(amountPaid) || 0;
  const insurance = Number(insuranceCost) || 0;
  const hasFees = fees && [fees.platformCommission, fees.processingFee, fees.fxBuffer]
    .some((v) => v !== null && v !== undefined && v !== '');
  const net = hasFees
    ? paid - insurance - (Number(fees.platformCommission) || 0) - (Number(fees.processingFee) || 0) - (Number(fees.fxBuffer) || 0)
    : (paid - insurance) / (Number(multiplier) > 0 ? Number(multiplier) : 1);
  return Math.max(0, Number(net.toFixed(2)));
}

/** Same, converted into `toCurrency`. `convert(amount, from, to)` does the FX. */
export async function travelerEarningIn({ amountPaid, insuranceCost, fees = null, paymentCurrency, toCurrency, multiplier, convert }) {
  const m = multiplier ?? await getSurchargeMultiplier();
  const net = netForTraveler({ amountPaid, insuranceCost, fees, multiplier: m });
  const from = String(paymentCurrency || 'USD').toUpperCase();
  const to = String(toCurrency || from).toUpperCase();
  if (net <= 0 || from === to) return { amount: net, currency: to, netInPaymentCurrency: net };
  const converted = Number((await convert(net, from, to)).toFixed(2));
  return { amount: converted, currency: to, netInPaymentCurrency: net };
}

/** Fee fields from a DB row (snake_case) or a normalized request (camelCase). */
export function feesFrom(row) {
  if (!row) return null;
  return {
    platformCommission: row.platform_commission ?? row.platformCommission,
    processingFee: row.processing_fee ?? row.processingFee,
    fxBuffer: row.fx_buffer ?? row.fxBuffer,
  };
}
