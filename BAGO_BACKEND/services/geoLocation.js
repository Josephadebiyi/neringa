import geoip from 'geoip-lite';

const PAYSTACK_CURRENCIES = new Set(['NGN', 'GHS', 'KES', 'ZAR']);
const UNKNOWN_COUNTRY_VALUES = new Set(['', 'XX', 'T1', 'A1', 'A2', 'O1']);

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
  if (!clean || isPrivateIp(clean)) return null;
  const geo = geoip.lookup(clean);
  return geo?.country || null;
}

export function getCurrencyForCountryCode(countryCode) {
  if (!countryCode) return null;
  return ISO_TO_CURRENCY[String(countryCode).toUpperCase()] || null;
}

export function getGatewayForCurrency(currency) {
  return PAYSTACK_CURRENCIES.has((currency || '').toUpperCase()) ? 'paystack' : 'stripe';
}

function normalizeCountryCode(value) {
  const code = String(value || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || UNKNOWN_COUNTRY_VALUES.has(code)) return null;
  return code;
}

function firstHeaderValue(value) {
  if (Array.isArray(value)) return value[0];
  return String(value || '').split(',')[0].trim();
}

function isPrivateIp(ip) {
  const clean = String(ip || '').replace(/^::ffff:/, '').trim();
  return (
    !clean ||
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(clean) ||
    clean.startsWith('fc') ||
    clean.startsWith('fd') ||
    clean.startsWith('fe80:')
  );
}

export function getClientIpFromRequest(req) {
  const candidates = [
    req.headers?.['cf-connecting-ip'],
    req.headers?.['true-client-ip'],
    req.headers?.['x-real-ip'],
    firstHeaderValue(req.headers?.['x-forwarded-for']),
    req.ip,
    req.socket?.remoteAddress,
    req.connection?.remoteAddress,
  ];

  for (const candidate of candidates) {
    const ip = firstHeaderValue(candidate).replace(/^::ffff:/, '').trim();
    if (ip && !isPrivateIp(ip)) return ip;
  }

  return firstHeaderValue(candidates.find(Boolean) || '').replace(/^::ffff:/, '').trim() || null;
}

export function getCountryFromRequestHeaders(req) {
  const headers = req.headers || {};
  const candidates = [
    headers['cf-ipcountry'],
    headers['x-vercel-ip-country'],
    headers['cloudfront-viewer-country'],
    headers['x-country-code'],
    headers['x-app-country-code'],
  ];

  for (const candidate of candidates) {
    const code = normalizeCountryCode(firstHeaderValue(candidate));
    if (code) return code;
  }

  return null;
}

export function getLocationData(ip) {
  const countryCode = normalizeCountryCode(getCountryFromIp(ip));
  const currency = getCurrencyForCountryCode(countryCode);
  const gateway = currency ? getGatewayForCurrency(currency) : null;
  return {
    countryCode,
    currency,
    gateway,
    ip: ip || null,
    source: countryCode ? 'geoip-lite' : 'unknown',
    confidence: countryCode ? 'medium' : 'none',
  };
}

export function getLocationDataFromRequest(req) {
  const ip = getClientIpFromRequest(req);
  const headerCountryCode = getCountryFromRequestHeaders(req);
  if (headerCountryCode) {
    const currency = getCurrencyForCountryCode(headerCountryCode);
    return {
      countryCode: headerCountryCode,
      currency,
      gateway: currency ? getGatewayForCurrency(currency) : null,
      ip,
      source: 'request-header',
      confidence: 'high',
    };
  }

  return getLocationData(ip);
}
