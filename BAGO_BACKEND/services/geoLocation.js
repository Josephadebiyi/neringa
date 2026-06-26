import geoip from 'geoip-lite';

const PAYSTACK_CURRENCIES = new Set(['NGN', 'GHS', 'KES', 'ZAR']);

// ISO-3166-1 alpha-2 → currency code
const ISO_TO_CURRENCY = {
  // West Africa (Paystack)
  NG: 'NGN', GH: 'GHS',
  // East Africa (Paystack)
  KE: 'KES',
  // Southern Africa (Paystack)
  ZA: 'ZAR',
  // Rest of Africa
  EG: 'EGP', ET: 'ETB', TZ: 'TZS', UG: 'UGX', RW: 'RWF',
  SN: 'XOF', CI: 'XOF', ML: 'XOF', BF: 'XOF', NE: 'XOF', TG: 'XOF', BJ: 'XOF',
  CM: 'XAF', GA: 'XAF', CG: 'XAF', TD: 'XAF', CF: 'XAF', GQ: 'XAF',
  MA: 'MAD', TN: 'TND', DZ: 'DZD', LY: 'LYD',
  MU: 'MUR', MG: 'MGA', ZM: 'ZMW', ZW: 'ZWL',
  NA: 'NAD', BW: 'BWP', MW: 'MWK', MZ: 'MZN', SZ: 'SZL', LS: 'LSL',
  GM: 'GMD', GN: 'GNF', SL: 'SLE', LR: 'LRD', CV: 'CVE',
  AO: 'AOA', BI: 'BIF', DJ: 'DJF', ER: 'ERN', SO: 'SOS',
  SS: 'SSP', SD: 'SDG', KM: 'KMF', ST: 'STN', SC: 'SCR',
  // Europe (Eurozone)
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR',
  BE: 'EUR', AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR',
  GR: 'EUR', LU: 'EUR', SK: 'EUR', SI: 'EUR', LT: 'EUR',
  LV: 'EUR', EE: 'EUR', CY: 'EUR', MT: 'EUR', HR: 'EUR',
  // Europe (non-Euro)
  GB: 'GBP', CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN',
  // Americas
  US: 'USD', CA: 'CAD', MX: 'MXN', BR: 'BRL',
  AR: 'ARS', CO: 'COP', CL: 'CLP', PE: 'PEN', UY: 'UYU',
  // Asia-Pacific
  AU: 'AUD', NZ: 'NZD', JP: 'JPY', CN: 'CNY',
  IN: 'INR', KR: 'KRW', SG: 'SGD', HK: 'HKD',
  MY: 'MYR', TH: 'THB', ID: 'IDR', PH: 'PHP',
  VN: 'VND', PK: 'PKR', BD: 'BDT', LK: 'LKR',
  // Middle East
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD',
  BH: 'BHD', OM: 'OMR', JO: 'JOD', IL: 'ILS', TR: 'TRY',
};

export function getCountryFromIp(ip) {
  const clean = (ip || '').replace(/^::ffff:/, '');
  if (!clean || clean === '127.0.0.1' || clean === '::1') return null;
  const geo = geoip.lookup(clean);
  return geo?.country || null;
}

export function getCurrencyForCountryCode(countryCode) {
  if (!countryCode) return 'EUR';
  return ISO_TO_CURRENCY[countryCode.toUpperCase()] || 'EUR';
}

export function getGatewayForCurrency(currency) {
  return PAYSTACK_CURRENCIES.has((currency || '').toUpperCase()) ? 'paystack' : 'stripe';
}

export function getLocationData(ip) {
  const countryCode = getCountryFromIp(ip);
  const currency = getCurrencyForCountryCode(countryCode);
  const gateway = getGatewayForCurrency(currency);
  return { countryCode, currency, gateway };
}
