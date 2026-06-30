// utils/insuranceCalculator.js
// Dynamic insurance pricing logic - same price all routes, all currencies
// Shared between web and mobile apps

/**
 * Convert currency using exchange rates
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @param {Object} exchangeRates - Exchange rates object (base USD)
 * @returns {number} - Converted amount
 */
function convertCurrency(amount, fromCurrency, toCurrency, exchangeRates) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Convert to USD first (if not already USD)
  let amountInUSD = amount;
  if (fromCurrency !== 'USD') {
    const fromRate = exchangeRates[fromCurrency];
    if (!fromRate) {
      throw new Error(`Exchange rate not found for ${fromCurrency}`);
    }
    amountInUSD = amount / fromRate;
  }

  // Convert from USD to target currency
  if (toCurrency !== 'USD') {
    const toRate = exchangeRates[toCurrency];
    if (!toRate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`);
    }
    return amountInUSD * toRate;
  }

  return amountInUSD;
}

/**
 * Calculate insurance cost based on item value
 *
 * Pricing Rules:
 * - Item value >= $100 USD equivalent → 1% of item value
 * - Item value < $100 USD equivalent → Fixed $3 USD
 * - Price converted to user's currency
 * - Same pricing across ALL routes (no regional variation)
 *
 * @param {number} itemValue - Item value in user's currency
 * @param {string} currencyCode - User's currency code (e.g., 'EUR', 'NGN', 'USD')
 * @param {Object} exchangeRates - Exchange rates object with USD as base
 * @returns {Object} - Insurance calculation result
 */
export function calculateInsurance(itemValue, currencyCode = 'USD', exchangeRates = {}) {
  try {
    // Validate inputs
    if (!itemValue || isNaN(itemValue) || itemValue < 0) {
      return {
        insurancePrice: 0,
        insurancePriceUSD: 0,
        currency: currencyCode,
        error: 'Invalid item value',
      };
    }

    if (!currencyCode || typeof currencyCode !== 'string') {
      return {
        insurancePrice: 0,
        insurancePriceUSD: 0,
        currency: 'USD',
        error: 'Invalid currency code',
      };
    }

    const currency = currencyCode.toUpperCase();

    // Check if we have exchange rates
    if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
      console.warn('⚠️ No exchange rates provided, using fallback calculation');
      const fallback = Math.round(itemValue * 0.005 * 100) / 100;
      return {
        insurancePrice: fallback,
        insurancePriceUSD: fallback,
        currency: 'USD',
        itemValue: itemValue,
        itemValueUSD: itemValue,
        threshold: '0.5%',
        warning: 'Exchange rates unavailable',
      };
    }

    // Step 1: Convert item value to USD for threshold comparison
    let itemValueUSD = itemValue;

    if (currency !== 'USD') {
      try {
        itemValueUSD = convertCurrency(itemValue, currency, 'USD', exchangeRates);
      } catch (error) {
        console.error('Currency conversion error:', error);
        return {
          insurancePrice: 0,
          insurancePriceUSD: 0,
          currency,
          error: error.message,
        };
      }
    }

    // 0.5% of item value (all-inclusive)
    let insurancePriceUSD = itemValueUSD * 0.005;

    // Round to 2 decimal places
    insurancePriceUSD = Math.round(insurancePriceUSD * 100) / 100;

    // Step 3: Convert insurance price back to user's currency
    let insurancePrice = insurancePriceUSD;

    if (currency !== 'USD') {
      try {
        insurancePrice = convertCurrency(insurancePriceUSD, 'USD', currency, exchangeRates);
      } catch (error) {
        console.error('Currency conversion error:', error);
        // Fallback to USD price
        insurancePrice = insurancePriceUSD;
      }
    }

    // Round to 2 decimal places
    insurancePrice = Math.round(insurancePrice * 100) / 100;

    return {
      insurancePrice,       // In user's currency
      insurancePriceUSD,    // In USD (for storage)
      currency,             // User's currency code
      itemValue,            // Original item value
      itemValueUSD,         // Item value in USD
      threshold: '0.5%',
    };

  } catch (error) {
    console.error('❌ Insurance calculation failed:', error.message);
    return {
      insurancePrice: 0,
      insurancePriceUSD: 0,
      currency: currencyCode,
      error: error.message,
    };
  }
}

/**
 * Fetch exchange rates via our backend (which applies markup, caching, and Claude fallback).
 * Falls back to exchangerate-api.com only if our backend is unreachable.
 * @returns {Promise<Object>} - Exchange rates object (base USD)
 */
export async function fetchExchangeRates() {
  // Try our own backend first — it has markup, DB cache, and Claude fallback
  try {
    const response = await fetch('/api/currency/rates');
    if (response.ok) {
      const data = await response.json();
      if (data?.rates && Object.keys(data.rates).length > 0) {
        return data.rates;
      }
    }
  } catch (_) {}

  // Backend unreachable — try the external API directly as last resort
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data?.rates) return data.rates;
  } catch (error) {
    console.error('❌ Failed to fetch exchange rates:', error.message);
  }

  // Hardcoded fallback so insurance calc never shows ₦0 or errors
  return {
    USD: 1, EUR: 0.92, GBP: 0.78, NGN: 1580, GHS: 15.5,
    KES: 130, ZAR: 18.5, CAD: 1.36, AUD: 1.55, JPY: 155,
    CNY: 7.25, INR: 83.5, BRL: 5.05, MXN: 17.2, CHF: 0.91,
    SEK: 10.5, NOK: 10.6, DKK: 6.9, SGD: 1.35, HKD: 7.82,
    AED: 3.67, SAR: 3.75, QAR: 3.64, KWD: 0.31, PKR: 278,
    RWF: 1300, UGX: 3700, TZS: 2600, XOF: 603, XAF: 603, EGP: 47,
  };
}
