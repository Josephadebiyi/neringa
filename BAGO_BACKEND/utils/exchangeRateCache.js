// utils/exchangeRateCache.js
// In-memory cache for exchange rates with 60-minute TTL

let ratesCache = {
  rates: null,
  baseCurrency: 'USD',
  timestamp: null,
  TTL: 60 * 60 * 1000, // 60 minutes in milliseconds
};

/**
 * Fetch exchange rates from API
 * @param {string} baseCurrency - Base currency code (default: USD)
 * @returns {Promise<Object>} - Exchange rates object
 */
async function fetchExchangeRates(baseCurrency = 'USD') {
  try {
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const data = await response.json();

    if (!data || !data.rates) {
      throw new Error('Invalid exchange rate data received');
    }

    return {
      rates: data.rates,
      baseCurrency: baseCurrency,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('❌ Failed to fetch exchange rates:', error.message);
    throw error;
  }
}

/**
 * Get exchange rates with caching
 * @param {string} baseCurrency - Base currency code
 * @returns {Promise<Object>} - Cached or fresh exchange rates
 */
export async function getExchangeRates(baseCurrency = 'USD') {
  const now = Date.now();

  // Check if cache is valid
  if (
    ratesCache.rates &&
    ratesCache.baseCurrency === baseCurrency &&
    ratesCache.timestamp &&
    (now - ratesCache.timestamp) < ratesCache.TTL
  ) {
    console.log('✅ Using cached exchange rates');
    return ratesCache.rates;
  }

  // Cache miss or expired - fetch new rates
  try {
    console.log('🔄 Fetching fresh exchange rates...');
    const freshData = await fetchExchangeRates(baseCurrency);

    // Update cache
    ratesCache = {
      rates: freshData.rates,
      baseCurrency: freshData.baseCurrency,
      timestamp: freshData.timestamp,
      TTL: ratesCache.TTL,
    };

    return freshData.rates;
  } catch (error) {
    // If fetch fails and we have stale cache, use it with warning
    if (ratesCache.rates) {
      console.warn('⚠️ Using stale exchange rates due to fetch failure');
      return ratesCache.rates;
    }

    // No cache available, throw error
    throw new Error('Unable to fetch exchange rates and no cache available');
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Promise<number>} - Converted amount
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const rates = await getExchangeRates(fromCurrency);

    if (!rates[toCurrency]) {
      throw new Error(`No exchange rate found for ${toCurrency}`);
    }

    const converted = amount * rates[toCurrency];
    return Math.round(converted * 100) / 100; // Round to 2 decimals
  } catch (error) {
    console.error(`❌ Currency conversion failed (${fromCurrency} → ${toCurrency}):`, error.message);
    throw error;
  }
}

/**
 * Clear the exchange rate cache (useful for testing)
 */
export function clearCache() {
  ratesCache = {
    rates: null,
    baseCurrency: 'USD',
    timestamp: null,
    TTL: 60 * 60 * 1000,
  };
  console.log('🗑️ Exchange rate cache cleared');
}
