/**
 * Currency Conversion Service
 * Handles real-time currency conversion using exchange rate APIs
 * and calculates payouts, commissions, and traveler prices.
 */

import ExchangeRate from '../models/ExchangeRate.js';
import Setting from '../models/settingScheme.js';
import fetch from 'node-fetch';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const PLATFORM_COMMISSION_RATE = 0.10; // 10%

/**
 * Fetch latest exchange rates from multiple free APIs with fallback
 */
export async function fetchAndCacheRates() {
  try {
    console.log(`🔄 Fetching fresh exchange rates...`);

    // Try multiple free APIs in order of preference
    const apis = [
      {
        name: 'exchangerate-api.com',
        url: 'https://api.exchangerate-api.com/v4/latest/USD',
        parseResponse: (data) => data.rates
      },
      {
        name: 'frankfurter.app',
        url: 'https://api.frankfurter.app/latest?from=USD',
        parseResponse: (data) => data.rates
      },
      {
        name: 'exchangerate.host (backup)',
        url: 'https://api.exchangerate.host/latest?base=USD',
        parseResponse: (data) => data.rates
      }
    ];

    let rates = null;
    let successApi = null;

    for (const api of apis) {
      try {
        console.log(`   Trying ${api.name}...`);
        const response = await fetch(api.url);

        if (!response.ok) {
          console.warn(`   ${api.name} returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        rates = api.parseResponse(data);

        if (rates && Object.keys(rates).length > 0) {
          successApi = api.name;
          break;
        }
      } catch (apiError) {
        console.warn(`   ${api.name} failed:`, apiError.message);
        continue;
      }
    }

    if (!rates) {
      throw new Error('All exchange rate APIs failed');
    }

    console.log(`✅ Successfully fetched rates from ${successApi}`);

    // Update database cache
    await ExchangeRate.findOneAndUpdate(
      { baseCurrency: 'USD' },
      {
        rates: rates,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('✅ Exchange rates cached in database');
    return rates;
  } catch (error) {
    console.error('❌ Failed to fetch exchange rates:', error);
    throw error;
  }
}

/**
 * Get internal exchange rates (from cache or fresh fetch)
 */
async function getCachedRates() {
  try {
    const cached = await ExchangeRate.findOne({ baseCurrency: 'USD' });
    
    if (cached && (Date.now() - new Date(cached.lastUpdated).getTime()) < CACHE_DURATION) {
      return cached.rates;
    }

    return await fetchAndCacheRates();
  } catch (error) {
    console.warn('⚠️ Cache fetch failed, returning fallback rates:', error.message);
    // Return MongoDB cache anyway if fetch fails, even if expired
    const expired = await ExchangeRate.findOne({ baseCurrency: 'USD' });
    if (expired) return expired.rates;

    // Hard fallback
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.78,
      NGN: 1500,
      GHS: 15.0,
      KES: 130,
      ZAR: 18.5,
      CAD: 1.35,
      AUD: 1.50,
    };
  }
}

async function getConfiguredRates() {
  try {
    const setting = await Setting.findOne({});
    const configuredBaseCurrency = String(setting?.baseCurrency || 'USD').trim().toUpperCase();
    const configuredRatesRaw = setting?.exchangeRates;
    const configuredSupported = Array.isArray(setting?.supportedCurrencies)
      ? setting.supportedCurrencies.map((value) => String(value).trim().toUpperCase()).filter(Boolean)
      : [];

    const normalizedRates = {};
    if (configuredRatesRaw) {
      const entries = configuredRatesRaw instanceof Map
        ? Array.from(configuredRatesRaw.entries())
        : Object.entries(configuredRatesRaw);

      for (const [currency, rate] of entries) {
        const code = String(currency || '').trim().toUpperCase();
        const numericRate = Number(rate);
        if (code && Number.isFinite(numericRate) && numericRate > 0) {
          normalizedRates[code] = numericRate;
        }
      }
    }

    if (!normalizedRates.USD) {
      normalizedRates.USD = 1;
    }

    const supportedCurrencies = configuredSupported.length > 0
      ? [...new Set([...configuredSupported, 'USD'])]
      : Object.keys(normalizedRates);

    return {
      baseCurrency: configuredBaseCurrency || 'USD',
      supportedCurrencies,
      rates: normalizedRates,
    };
  } catch (error) {
    console.warn('⚠️ Failed to load configured currency rates:', error.message);
    return {
      baseCurrency: 'USD',
      supportedCurrencies: [],
      rates: {},
    };
  }
}

/**
 * 8. Core functions required
 */

/**
 * convertCurrency(amount, fromCurrency, toCurrency)
 * Uses high precision decimal calculations
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const rates = await getCachedRates();
    const configured = await getConfiguredRates();
    
    // Normalize currencies to uppercase
    fromCurrency = fromCurrency.toUpperCase();
    toCurrency = toCurrency.toUpperCase();

    if (fromCurrency === toCurrency) return Number(amount);

    // Hard fallback rates for currencies that may be missing from the cached API response
    // (e.g. frankfurter.app does not include NGN/GHS/KES)
    const HARD_FALLBACK = { NGN: 1500, GHS: 15.0, KES: 130, UGX: 3700, TZS: 2600, ZAR: 18.5, RWF: 1300 };
    const effectiveRates = {
      ...HARD_FALLBACK,
      ...rates,
      ...configured.rates,
    };

    if (!effectiveRates[fromCurrency] && fromCurrency !== 'USD') {
      throw new Error(`Currency ${fromCurrency} not supported`);
    }
    if (!effectiveRates[toCurrency] && toCurrency !== 'USD') {
      throw new Error(`Currency ${toCurrency} not supported`);
    }

    // Convert to USD base first
    const fromRate = fromCurrency === 'USD' ? 1 : effectiveRates[fromCurrency];
    const toRate = toCurrency === 'USD' ? 1 : effectiveRates[toCurrency];

    // amount * (toRate / fromRate)
    const convertedAmount = (Number(amount) * toRate) / fromRate;
    
    // High precision: return with 4 decimal places for internal use, 
    // though usually rounded to 2 for display/payment
    return parseFloat(convertedAmount.toFixed(4));
  } catch (error) {
    console.error('❌ Currency conversion error:', error);
    throw error;
  }
}

/**
 * calculateTravelerPrice(weight, pricePerKg)
 */
export function calculateTravelerPrice(weight, pricePerKg) {
  return parseFloat((Number(weight) * Number(pricePerKg)).toFixed(2));
}

/**
 * calculateCommission(amount, commissionRate = PLATFORM_COMMISSION_RATE)
 */
export function calculateCommission(amount, commissionRate = PLATFORM_COMMISSION_RATE) {
  return parseFloat((Number(amount) * Number(commissionRate)).toFixed(2));
}

/**
 * calculateTravelerPayout(totalPrice, commission)
 */
export function calculateTravelerPayout(totalPrice, commission) {
  return parseFloat((Number(totalPrice) - Number(commission)).toFixed(2));
}

/**
 * choosePaymentProcessor(currency)
 * Stripe for global, Paystack for African
 */
export function choosePaymentProcessor(currency) {
  const africanCurrencies = ['NGN', 'GHS', 'KES', 'ZAR', 'RWF', 'UGX', 'TZS'];
  const normalizedCurrency = currency.toUpperCase();
  
  if (africanCurrencies.includes(normalizedCurrency)) {
    return 'paystack';
  }
  return 'stripe';
}

/**
 * Additional utility for the flow described in rules:
 * - Convert the sender’s payment into the traveler’s wallet currency
 * - Pay the traveler in their wallet currency
 * - Deduct commission from traveler's price
 */
export async function processPaymentQuote({ 
  weight, 
  travelerPricePerKg, 
  travelerCurrency, 
  senderCurrency 
}) {
  const totalTravelerPrice = calculateTravelerPrice(weight, travelerPricePerKg);
  
  // Calculate commission in traveler's currency
  const commission = calculateCommission(totalTravelerPrice);
  const travelerPayout = calculateTravelerPayout(totalTravelerPrice, commission);
  
  // Convert total price sender needs to pay into sender's currency
  const senderAmount = await convertCurrency(totalTravelerPrice, travelerCurrency, senderCurrency);
  
  const processor = choosePaymentProcessor(senderCurrency);

  return {
    travelerPrice: totalTravelerPrice,
    travelerCurrency,
    travelerPayout,
    commission,
    senderAmount: parseFloat(senderAmount.toFixed(2)),
    senderCurrency,
    processor,
    exchangeRate: parseFloat((senderAmount / totalTravelerPrice).toFixed(6))
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency) {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    GHS: 'GH₵',
    KES: 'KSh',
    ZAR: 'R',
    CAD: 'C$',
    AUD: 'A$',
  };

  const symbol = symbols[currency.toUpperCase()] || currency;
  return `${symbol}${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Get currency by country code
 * @param {String} countryCode - ISO country code
 * @returns {String} - Currency code
 */
export function getCurrencyByCountry(countryCode) {
  const currencyMap = {
    US: 'USD',
    GB: 'GBP',
    NG: 'NGN',
    GH: 'GHS',
    KE: 'KES',
    ZA: 'ZAR',
    CA: 'CAD',
    AU: 'AUD',
    DE: 'EUR',
    FR: 'EUR',
    ES: 'EUR',
    IT: 'EUR',
    NL: 'EUR',
    BE: 'EUR',
    AT: 'EUR',
    IE: 'EUR',
    PT: 'EUR',
    FI: 'EUR',
    GR: 'EUR',
  };

  return currencyMap[countryCode?.toUpperCase()] || 'USD';
}

/**
 * Get payment gateway for a country
 */
export function getPaymentGatewayForCountry(countryCode) {
  const africanCountries = ['NG', 'GH', 'KE', 'ZA', 'CI', 'SN', 'TZ', 'UG', 'RW'];
  if (africanCountries.includes(countryCode?.toUpperCase())) {
    return 'paystack';
  }
  return 'stripe';
}

export async function getExchangeRate(fromCurrency, toCurrency) {
    const amount = 1;
    return await convertCurrency(amount, fromCurrency, toCurrency);
}

export async function getAllRates() {
    const rates = await getCachedRates();
    const configured = await getConfiguredRates();
    const mergedRates = {
        ...rates,
        ...configured.rates,
    };
    const supportedCurrencies = configured.supportedCurrencies.length > 0
        ? configured.supportedCurrencies
        : Object.keys(mergedRates);

    return {
        baseCurrency: configured.baseCurrency || 'USD',
        supportedCurrencies,
        rates: mergedRates,
        timestamp: new Date()
    };
}
