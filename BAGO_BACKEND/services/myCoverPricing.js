import { convertCurrency } from './currencyConverter.js';

export const MYCOVER_PREMIUM_CAP_NGN = 3000;
export const MYCOVER_PREMIUM_RATE_PERCENT = 0.5;
export const AFRICA_PROTECTION_FEE_NGN = 3000;
export const NON_AFRICA_PROTECTION_FEE_EUR = 5;

const AFRICAN_COUNTRY_CODES = new Set([
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD',
  'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE',
  'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG',
  'RW', 'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG',
  'ZM', 'ZW',
]);

const AFRICAN_COUNTRY_NAMES = new Set([
  'algeria', 'angola', 'benin', 'botswana', 'burkina faso', 'burundi', 'cabo verde',
  'cape verde', 'cameroon', 'central african republic', 'chad', 'comoros', 'congo',
  'democratic republic of the congo', 'dr congo', 'ivory coast', 'cote divoire',
  'djibouti', 'egypt', 'equatorial guinea', 'eritrea', 'eswatini', 'swaziland',
  'ethiopia', 'gabon', 'gambia', 'ghana', 'guinea', 'guinea bissau', 'kenya',
  'lesotho', 'liberia', 'libya', 'madagascar', 'malawi', 'mali', 'mauritania',
  'mauritius', 'morocco', 'mozambique', 'namibia', 'niger', 'nigeria', 'rwanda',
  'sao tome and principe', 'senegal', 'seychelles', 'sierra leone', 'somalia',
  'south africa', 'south sudan', 'sudan', 'tanzania', 'togo', 'tunisia', 'uganda',
  'zambia', 'zimbabwe',
]);

const normalizeCountry = (value = '') => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z ]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function isAfricanCountry(value) {
  const normalized = normalizeCountry(value);
  if (!normalized) return false;
  if (normalized.length === 2 && AFRICAN_COUNTRY_CODES.has(normalized.toUpperCase())) return true;
  return AFRICAN_COUNTRY_NAMES.has(normalized.toLowerCase());
}

export async function getRouteProtectionFee({ fromCountry, toCountry, currency = 'NGN' }) {
  const targetCurrency = String(currency || 'NGN').trim().toUpperCase();
  const touchesAfrica = isAfricanCountry(fromCountry) || isAfricanCountry(toCountry);
  const baseAmount = touchesAfrica ? AFRICA_PROTECTION_FEE_NGN : NON_AFRICA_PROTECTION_FEE_EUR;
  const baseCurrency = touchesAfrica ? 'NGN' : 'EUR';
  const amount = targetCurrency === baseCurrency
    ? baseAmount
    : await convertCurrency(baseAmount, baseCurrency, targetCurrency);

  return {
    amount: Number(Number(amount).toFixed(2)),
    baseAmount,
    baseCurrency,
    region: touchesAfrica ? 'africa' : 'non_africa',
  };
}

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
