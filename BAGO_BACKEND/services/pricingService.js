import { queryOne } from '../lib/postgres/db.js';

// Legacy 10% commission rate — kept for backward compat with WalletController
export const DEFAULT_COMMISSION_RATE = 0.10;

export async function getCommissionRate() {
  try {
    const row = await queryOne(
      `SELECT value FROM public.bago_config WHERE key = 'app_settings'`,
    );
    if (row?.value) {
      const settings = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      const rate = settings?.commissionRate ?? settings?.commissionPercentage;
      if (typeof rate === 'number' && rate > 0 && rate <= 1) return rate;
      if (typeof rate === 'number' && rate > 1 && rate <= 100) return rate / 100;
    }
  } catch (e) {
    console.warn('pricingService: could not read commission from bago_config:', e.message);
  }
  return DEFAULT_COMMISSION_RATE;
}

export function calculateCommission(amount, commissionRate = DEFAULT_COMMISSION_RATE) {
  return parseFloat((Number(amount) * Number(commissionRate)).toFixed(2));
}

export function calculateTravelerPayout(totalPrice, commission) {
  return parseFloat((Number(totalPrice) - Number(commission)).toFixed(2));
}

// ── All-inclusive pricing ────────────────────────────────────────────────────

const DEFAULT_PRICING_CONFIG = {
  platformCommissionPercent: 15,
  processingFeePercent: 5,
  fxBufferPercent: 0,
  senderInsurancePercent: 0.5,
};

function _toPercent(value, fallback) {
  if (typeof value === 'number' && value >= 0 && value <= 100) return value;
  return fallback;
}

/**
 * Returns all fee percentages from DB config, falling back to defaults.
 * Platform fee is charged on traveler payout. Processing buffer is charged on
 * subtotal after platform fee. Traveler payout is never reduced.
 * senderInsurancePercent applied to declared item value when sender opts in.
 */
export async function getFullPricingConfig() {
  try {
    const row = await queryOne(
      `SELECT value FROM public.bago_config WHERE key = 'app_settings'`,
    );
    if (row?.value) {
      const s = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      return {
        platformCommissionPercent: _toPercent(s?.platformCommissionPercent, DEFAULT_PRICING_CONFIG.platformCommissionPercent),
        processingFeePercent: _toPercent(s?.processingFeePercent, DEFAULT_PRICING_CONFIG.processingFeePercent),
        fxBufferPercent: _toPercent(s?.fxBufferPercent, DEFAULT_PRICING_CONFIG.fxBufferPercent),
        senderInsurancePercent: _toPercent(s?.senderInsurancePercent, DEFAULT_PRICING_CONFIG.senderInsurancePercent),
      };
    }
  } catch (e) {
    console.warn('pricingService: could not read pricing config from bago_config:', e.message);
  }
  return { ...DEFAULT_PRICING_CONFIG };
}

/**
 * Calculates the all-inclusive sender price from the traveler payout.
 * Traveler receives exactly travelerPayout; sender pays travelerPayout × surchargeMultiplier.
 */
export function calculateAllInclusivePrice(travelerPayout, config) {
  const { platformCommissionPercent, processingFeePercent, fxBufferPercent = 0 } = config;
  const tp = Number(travelerPayout);
  const platformCommission = parseFloat((tp * platformCommissionPercent / 100).toFixed(2));
  const subtotal = parseFloat((tp + platformCommission).toFixed(2));
  const processingFee = parseFloat((subtotal * processingFeePercent / 100).toFixed(2));
  const fxBuffer = parseFloat((subtotal * fxBufferPercent / 100).toFixed(2));
  const senderShippingFee = parseFloat((subtotal + processingFee + fxBuffer).toFixed(2));
  const bagoNetRevenue = parseFloat((senderShippingFee - tp).toFixed(2));
  const surchargeMultiplier = tp > 0 ? senderShippingFee / tp : 1;

  return {
    travelerPayout: parseFloat(tp.toFixed(2)),
    platformCommission,
    processingBuffer: processingFee,
    processingFee,
    fxBuffer,
    senderShippingFee,
    bagoNetRevenue,
    surchargeMultiplier,
  };
}
