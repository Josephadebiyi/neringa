import fetch from 'node-fetch';
import { queryOne } from '../lib/postgres/db.js';
import { DEFAULT_COMMISSION_RATE, getFullPricingConfig, calculateAllInclusivePrice } from './pricingService.js';

const CACHE_DURATION = 10 * 60 * 1000;
const PLATFORM_COMMISSION_RATE = DEFAULT_COMMISSION_RATE;

// Applied to all rates returned to clients — a 0.5% buffer so displayed conversions
// never under-deliver value to the platform when FX moves between quote and settlement.
const FX_DISPLAY_MARKUP = 1.005;

const FALLBACK_RATES = {
  USD: 1,    EUR: 0.92,  GBP: 0.78,  NGN: 1580,  GHS: 15.5,
  KES: 130,  ZAR: 18.5,  CAD: 1.36,  AUD: 1.55,  JPY: 155,
  CNY: 7.25, INR: 83.5,  BRL: 5.05,  MXN: 17.2,  CHF: 0.91,
  SEK: 10.5, NOK: 10.6,  DKK: 6.9,   SGD: 1.35,  HKD: 7.82,
  AED: 3.67, SAR: 3.75,  QAR: 3.64,  KWD: 0.31,  PKR: 278,
  BDT: 110,  LKR: 310,   EGP: 47,    MAD: 10.1,  TND: 3.1,
  RWF: 1300, UGX: 3700,  TZS: 2600,  XOF: 603,   XAF: 603,
  ETB: 57,   MZN: 63,    ZMW: 25,    GMD: 67,
};

async function getRatesFromClaude() {
  try {
    const { askClaude, isAiEnabled } = await import('./aiService.js');
    if (!isAiEnabled()) return null;
    const today = new Date().toISOString().slice(0, 10);
    const text = await askClaude({
      system: 'You are a financial data assistant. Return ONLY a valid JSON object with no explanation, markdown, or code fences.',
      messages: [{
        role: 'user',
        content: `Provide approximate USD exchange rates as of ${today} for: NGN, GHS, KES, ZAR, EUR, GBP, CAD, AUD, JPY, CNY, INR, BRL, MXN, CHF, SEK, NOK, DKK, SGD, HKD, AED, SAR, QAR, KWD, PKR, BDT, LKR, EGP, MAD, TND, RWF, UGX, TZS, XOF, XAF, ETB, MZN, ZMW. Return ONLY a JSON object like: {"NGN": 1580, "EUR": 0.92, "GHS": 15.5, ...}`,
      }],
      model: 'claude-haiku-4-5-20251001',
      maxTokens: 700,
    });
    const json = text.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
    const parsed = JSON.parse(json);
    if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 5) {
      console.log('✅ Got exchange rates from Claude AI fallback');
      return parsed;
    }
  } catch (e) {
    console.warn('⚠️ Claude AI rate fallback failed:', e.message);
  }
  return null;
}

async function upsertRatesCache(rates) {
  try {
    await queryOne(
      `insert into public.exchange_rates (base_currency, rates, last_updated, updated_at)
       values ('USD', $1, timezone('utc', now()), timezone('utc', now()))
       on conflict (base_currency)
       do update set rates = excluded.rates, last_updated = excluded.last_updated, updated_at = excluded.updated_at
       returning rates`,
      [rates],
    );
  } catch {}
}

export async function fetchAndCacheRates() {
  console.log('🔄 Fetching fresh exchange rates...');
  const apis = [
    { name: 'exchangerate-api.com', url: 'https://api.exchangerate-api.com/v4/latest/USD', parseResponse: (data) => data.rates },
    { name: 'frankfurter.app', url: 'https://api.frankfurter.app/latest?from=USD', parseResponse: (data) => ({ ...data.rates, USD: 1 }) },
    { name: 'exchangerate.host', url: 'https://api.exchangerate.host/latest?base=USD', parseResponse: (data) => data.rates },
  ];

  for (const api of apis) {
    try {
      console.log(`   Trying ${api.name}...`);
      const response = await fetch(api.url, { timeout: 8000 });
      if (!response.ok) continue;
      const data = await response.json();
      const rates = api.parseResponse(data);
      if (rates && Object.keys(rates).length > 0) {
        await upsertRatesCache(rates);
        console.log(`✅ Fetched rates from ${api.name}`);
        return rates;
      }
    } catch (apiError) {
      console.warn(`   ${api.name} failed:`, apiError.message);
    }
  }

  // All external APIs failed — ask Claude for best-estimate rates
  const claudeRates = await getRatesFromClaude();
  if (claudeRates) {
    await upsertRatesCache(claudeRates);
    return claudeRates;
  }

  throw new Error('All exchange rate sources failed including Claude fallback');
}

async function getAdminRates() {
  try {
    const row = await queryOne(
      `SELECT value FROM public.bago_config WHERE key = 'app_settings'`,
    );
    if (row?.value) {
      const settings = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      const rates = settings?.exchangeRates;
      if (rates && typeof rates === 'object') {
        const entries = Object.entries(rates).filter(([, v]) => typeof v === 'number' && v > 0);
        if (entries.length > 0) {
          return Object.fromEntries(entries);
        }
      }
    }
  } catch (e) {
    console.warn('⚠️ Could not read admin rates from bago_config:', e.message);
  }
  return null;
}

async function getCachedRates() {
  // Admin-configured rates take priority — lets the platform control exchange rates.
  const adminRates = await getAdminRates();
  if (adminRates) return adminRates;

  // Fresh DB cache?
  try {
    const cached = await queryOne(
      `select rates, last_updated from public.exchange_rates where base_currency = 'USD'`,
    );
    if (cached?.rates && cached?.last_updated && (Date.now() - new Date(cached.last_updated).getTime()) < CACHE_DURATION) {
      return cached.rates;
    }
  } catch {}

  // Cache stale or empty — try live APIs then Claude
  try {
    return await fetchAndCacheRates();
  } catch (error) {
    console.warn('⚠️ All rate sources failed, using hardcoded fallback rates');
    return FALLBACK_RATES;
  }
}

export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const rates = await getCachedRates();
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) return Number(amount);

    const effectiveRates = { ...FALLBACK_RATES, ...rates };

    if (!effectiveRates[fromCurrency] && fromCurrency !== 'USD') {
      throw new Error(`Currency ${fromCurrency} not supported`);
    }
    if (!effectiveRates[toCurrency] && toCurrency !== 'USD') {
      throw new Error(`Currency ${toCurrency} not supported`);
    }

    const fromRate = fromCurrency === 'USD' ? 1 : effectiveRates[fromCurrency];
    const toRate = toCurrency === 'USD' ? 1 : effectiveRates[toCurrency];
    if (!fromRate || fromRate <= 0) throw new Error(`Invalid exchange rate for ${fromCurrency}`);
    if (!toRate || toRate <= 0) throw new Error(`Invalid exchange rate for ${toCurrency}`);

    const raw = (Number(amount) * toRate) / fromRate;
    // Apply 0.5% display markup so conversions always cover FX slippage
    return Number((raw * FX_DISPLAY_MARKUP).toFixed(4));
  } catch (error) {
    console.error('❌ Currency conversion error:', error);
    throw error;
  }
}

export async function getExchangeRate(fromCurrency, toCurrency) {
  return convertCurrency(1, fromCurrency, toCurrency);
}

export function calculateTravelerPrice(weight, pricePerKg) {
  return parseFloat((Number(weight) * Number(pricePerKg)).toFixed(2));
}

export function calculateCommission(amount, commissionRate = PLATFORM_COMMISSION_RATE) {
  return parseFloat((Number(amount) * Number(commissionRate)).toFixed(2));
}

export function calculateTravelerPayout(totalPrice, commission) {
  return parseFloat((Number(totalPrice) - Number(commission)).toFixed(2));
}

const COUNTRY_CURRENCY_MAP = {
  US: 'USD', GB: 'GBP', EU: 'EUR', DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR',
  PT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', FI: 'EUR', IE: 'EUR', GR: 'EUR',
  NG: 'NGN', GH: 'GHS', KE: 'KES', ZA: 'ZAR', RW: 'RWF', UG: 'UGX', TZ: 'TZS',
  SN: 'XOF', CI: 'XOF', CM: 'XAF', ET: 'ETB', EG: 'EGP', MA: 'MAD', TN: 'TND',
  CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', CN: 'CNY', IN: 'INR', BR: 'BRL',
  MX: 'MXN', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', SG: 'SGD', HK: 'HKD',
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', PK: 'PKR', BD: 'BDT', LK: 'LKR',
};

export function getCurrencyByCountry(countryCode) {
  if (!countryCode) return 'USD';
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] ?? 'USD';
}

export function choosePaymentProcessor(currency) {
  const africanCurrencies = ['NGN', 'GHS', 'KES', 'ZAR', 'RWF', 'UGX', 'TZS'];
  return africanCurrencies.includes(currency.toUpperCase()) ? 'paystack' : 'stripe';
}

export async function getAllRates() {
  const raw = await getCachedRates();
  // Apply 0.5% display markup to every rate returned to clients
  const rates = Object.fromEntries(
    Object.entries({ ...FALLBACK_RATES, ...raw }).map(([k, v]) => [k, Number((v * FX_DISPLAY_MARKUP).toFixed(6))]),
  );
  return {
    baseCurrency: 'USD',
    rates,
    timestamp: new Date().toISOString(),
  };
}

export function formatCurrency(amount, currency) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${Number(amount).toFixed(2)}`;
  }
}

export async function processPaymentQuote({ weight, travelerPricePerKg, travelerCurrency, senderCurrency }) {
  // travelerPayout = exactly what the traveler set (weight × pricePerKg)
  const travelerPayout = calculateTravelerPrice(weight, travelerPricePerKg);
  const config = await getFullPricingConfig();
  const breakdown = calculateAllInclusivePrice(travelerPayout, config);
  // Convert the all-inclusive sender fee from traveler's currency to sender's currency
  const senderAmount = await convertCurrency(breakdown.senderShippingFee, travelerCurrency, senderCurrency);
  const processor = choosePaymentProcessor(senderCurrency);

  return {
    weight: Number(weight),
    travelerPricePerKg: Number(travelerPricePerKg),
    travelerCurrency: travelerCurrency.toUpperCase(),
    senderCurrency: senderCurrency.toUpperCase(),
    travelerTotal: breakdown.travelerPayout,
    travelerPayout: breakdown.travelerPayout,
    senderTotal: breakdown.senderShippingFee,
    commission: breakdown.platformCommission,
    platformCommission: breakdown.platformCommission,
    processingFee: breakdown.processingFee,
    fxBuffer: breakdown.fxBuffer,
    bagoNetRevenue: breakdown.bagoNetRevenue,
    senderAmount: Number(senderAmount.toFixed(2)),
    paymentProcessor: processor,
  };
}
