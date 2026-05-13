import { queryOne } from '../lib/postgres/db.js';

// Single source of truth for the platform commission rate
export const DEFAULT_COMMISSION_RATE = 0.10;

/**
 * Returns the platform commission rate from DB config, falling back to 10%.
 * All commission calculations across WalletController, currencyConverter, and
 * routeController should call this instead of hardcoding a number.
 */
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
