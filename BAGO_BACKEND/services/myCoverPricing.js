import { convertCurrency } from './currencyConverter.js';

export const MYCOVER_PREMIUM_CAP_NGN = 3000;
export const MYCOVER_PREMIUM_RATE_PERCENT = 0.5;

export async function getMyCoverPremium(declaredValue, currency = 'NGN') {
  const targetCurrency = String(currency || 'NGN').trim().toUpperCase();
  const insuredValueNgn = await convertDeclaredValueToNgn(declaredValue, targetCurrency);
  const premiumNgn = Math.min(
    MYCOVER_PREMIUM_CAP_NGN,
    Number(((insuredValueNgn * MYCOVER_PREMIUM_RATE_PERCENT) / 100).toFixed(2)),
  );
  if (targetCurrency === 'NGN') return premiumNgn;

  const converted = await convertCurrency(
    premiumNgn,
    'NGN',
    targetCurrency,
  );
  return Number(Number(converted).toFixed(2));
}

export async function convertDeclaredValueToNgn(value, currency = 'NGN') {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 1;

  const sourceCurrency = String(currency || 'NGN').trim().toUpperCase();
  const valueNgn = sourceCurrency === 'NGN'
    ? numericValue
    : await convertCurrency(numericValue, sourceCurrency, 'NGN');

  return Math.max(1, Math.round(Number(valueNgn)));
}
