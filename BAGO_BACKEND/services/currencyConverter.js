import fetch from 'node-fetch';
import { queryOne } from '../lib/postgres/db.js';

const CACHE_DURATION = 10 * 60 * 1000;
const PLATFORM_COMMISSION_RATE = 0.10;

const FALLBACK_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  NGN: 1500,
  GHS: 15.0,
  KES: 130,
  ZAR: 18.5,
  CAD: 1.35,
  AUD: 1.5,
};

export async function fetchAndCacheRates() {
  try {
    console.log('🔄 Fetching fresh exchange rates...');
    const apis = [
      { name: 'exchangerate-api.com', url: 'https://api.exchangerate-api.com/v4/latest/USD', parseResponse: (data) => data.rates },
      { name: 'frankfurter.app', url: 'https://api.frankfurter.app/latest?from=USD', parseResponse: (data) => data.rates },
      { name: 'exchangerate.host (backup)', url: 'https://api.exchangerate.host/latest?base=USD', parseResponse: (data) => data.rates },
    ];

    let rates = null;
    let successApi = null;

    for (const api of apis) {
      try {
        console.log(`   Trying ${api.name}...`);
        const response = await fetch(api.url);
        if (!response.ok) continue;
        const data = await response.json();
        rates = api.parseResponse(data);
        if (rates && Object.keys(rates).length > 0) {
          successApi = api.name;
          break;
        }
      } catch (apiError) {
        console.warn(`   ${api.name} failed:`, apiError.message);
      }
    }

    if (!rates) {
      throw new Error('All exchange rate APIs failed');
    }

    await queryOne(
      `
        insert into public.exchange_rates (base_currency, rates, last_updated, updated_at)
        values ('USD', $1, timezone('utc', now()), timezone('utc', now()))
        on conflict (base_currency)
        do update set
          rates = excluded.rates,
          last_updated = excluded.last_updated,
          updated_at = excluded.updated_at
        returning rates
      `,
      [rates],
    );

    console.log(`✅ Successfully fetched rates from ${successApi}`);
    return rates;
  } catch (error) {
    console.error('❌ Failed to fetch exchange rates:', error);
    throw error;
  }
}

async function getCachedRates() {
  try {
    const cached = await queryOne(
      `
        select rates, last_updated
        from public.exchange_rates
        where base_currency = 'USD'
      `,
    );

    if (cached?.rates && cached?.last_updated && (Date.now() - new Date(cached.last_updated).getTime()) < CACHE_DURATION) {
      return cached.rates;
    }

    return await fetchAndCacheRates();
  } catch (error) {
    console.warn('⚠️ Cache fetch failed, returning fallback rates:', error.message);
    return FALLBACK_RATES;
  }
}

export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const rates = await getCachedRates();
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) return Number(amount);

    const hardFallback = { NGN: 1500, GHS: 15.0, KES: 130, UGX: 3700, TZS: 2600, ZAR: 18.5, RWF: 1300 };
    const effectiveRates = { ...hardFallback, ...rates };

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
    return Number(((Number(amount) * toRate) / fromRate).toFixed(4));
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
  const rates = await getCachedRates();
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
  const travelerTotal = calculateTravelerPrice(weight, travelerPricePerKg);
  const commission = calculateCommission(travelerTotal);
  const travelerPayout = calculateTravelerPayout(travelerTotal, commission);
  const senderAmount = await convertCurrency(travelerTotal, travelerCurrency, senderCurrency);
  const processor = choosePaymentProcessor(senderCurrency);

  return {
    weight: Number(weight),
    travelerPricePerKg: Number(travelerPricePerKg),
    travelerCurrency: travelerCurrency.toUpperCase(),
    senderCurrency: senderCurrency.toUpperCase(),
    travelerTotal,
    commission,
    travelerPayout,
    senderAmount: Number(senderAmount.toFixed(2)),
    paymentProcessor: processor,
  };
}
