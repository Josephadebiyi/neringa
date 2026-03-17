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
      // Fallback: assume $3 fixed
      return {
        insurancePrice: 3,
        insurancePriceUSD: 3,
        currency: 'USD',
        itemValue: itemValue,
        itemValueUSD: itemValue,
        threshold: 'fallback',
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

    // Step 2: Apply threshold logic (in USD)
    let insurancePriceUSD;

    if (itemValueUSD >= 100) {
      // 1% of item value
      insurancePriceUSD = itemValueUSD * 0.01;
    } else {
      // Fixed $3
      insurancePriceUSD = 3;
    }

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
      threshold: itemValueUSD >= 100 ? '1%' : 'fixed',
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
 * Fetch exchange rates from API
 * @param {string} baseCurrency - Base currency (default: USD)
 * @returns {Promise<Object>} - Exchange rates object
 */
export async function fetchExchangeRates(baseCurrency = 'USD') {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.rates) {
      throw new Error('Invalid exchange rate data received');
    }

    return data.rates;
  } catch (error) {
    console.error('❌ Failed to fetch exchange rates:', error.message);
    throw error;
  }
}
