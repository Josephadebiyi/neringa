/**
 * Currency Conversion Service
 * Handles real-time currency conversion using exchange rate APIs
 */

// Cache exchange rates to reduce API calls
let rateCache = {
  rates: null,
  timestamp: null,
  baseCurrency: 'USD'
};

const CACHE_DURATION = 3600000; // 1 hour in milliseconds

/**
 * Fetch latest exchange rates
 * Uses exchangerate-api.com (free tier: 1500 requests/month)
 * Alternative: Use XE.com API if you have an API key
 */
async function fetchExchangeRates(baseCurrency = 'USD') {
  try {
    // Check cache first
    const now = Date.now();
    if (rateCache.rates && rateCache.timestamp && (now - rateCache.timestamp) < CACHE_DURATION && rateCache.baseCurrency === baseCurrency) {
      console.log('✅ Using cached exchange rates');
      return rateCache.rates;
    }

    // Fetch fresh rates
    console.log(`🔄 Fetching fresh exchange rates (base: ${baseCurrency})...`);
    const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);

    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();

    // Update cache
    rateCache = {
      rates: data.rates,
      timestamp: now,
      baseCurrency: baseCurrency
    };

    console.log('✅ Exchange rates fetched and cached');
    return data.rates;
  } catch (error) {
    console.error('❌ Failed to fetch exchange rates:', error);

    // Return cached rates if available, even if expired
    if (rateCache.rates) {
      console.warn('⚠️ Using expired cached rates as fallback');
      return rateCache.rates;
    }

    // Fallback to basic rates if no cache available
    console.warn('⚠️ Using fallback exchange rates');
    return {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      NGN: 1550,
      GHS: 15.5,
      KES: 129,
      ZAR: 18.5,
      CAD: 1.36,
      AUD: 1.52,
    };
  }
}

/**
 * Convert amount from one currency to another
 * @param {Number} amount - Amount to convert
 * @param {String} fromCurrency - Source currency code (e.g., 'USD')
 * @param {String} toCurrency - Target currency code (e.g., 'NGN')
 * @returns {Promise<Object>} - Conversion result with amount and rate
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    // No conversion needed if currencies are the same
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        originalCurrency: fromCurrency,
        targetCurrency: toCurrency,
        exchangeRate: 1,
        timestamp: new Date().toISOString()
      };
    }

    // Get exchange rates (USD base)
    const rates = await fetchExchangeRates('USD');

    // Convert to USD first if fromCurrency is not USD
    let amountInUSD = amount;
    if (fromCurrency !== 'USD') {
      if (!rates[fromCurrency]) {
        throw new Error(`Currency ${fromCurrency} not supported`);
      }
      amountInUSD = amount / rates[fromCurrency];
    }

    // Then convert from USD to target currency
    if (!rates[toCurrency]) {
      throw new Error(`Currency ${toCurrency} not supported`);
    }

    const convertedAmount = amountInUSD * rates[toCurrency];
    const exchangeRate = rates[toCurrency] / (fromCurrency === 'USD' ? 1 : rates[fromCurrency]);

    return {
      originalAmount: amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimals
      originalCurrency: fromCurrency,
      targetCurrency: toCurrency,
      exchangeRate: Math.round(exchangeRate * 10000) / 10000, // Round to 4 decimals
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Currency conversion error:', error);
    throw error;
  }
}

/**
 * Get exchange rate between two currencies
 * @param {String} fromCurrency - Source currency
 * @param {String} toCurrency - Target currency
 * @returns {Promise<Number>} - Exchange rate
 */
export async function getExchangeRate(fromCurrency, toCurrency) {
  try {
    if (fromCurrency === toCurrency) return 1;

    const rates = await fetchExchangeRates('USD');

    if (!rates[fromCurrency] || !rates[toCurrency]) {
      throw new Error('Currency not supported');
    }

    const rate = rates[toCurrency] / rates[fromCurrency];
    return Math.round(rate * 10000) / 10000;

  } catch (error) {
    console.error('❌ Get exchange rate error:', error);
    return 1; // Fallback to 1:1
  }
}

/**
 * Get all available currencies and their rates (USD base)
 * @returns {Promise<Object>} - All exchange rates
 */
export async function getAllRates() {
  try {
    const rates = await fetchExchangeRates('USD');
    return {
      baseCurrency: 'USD',
      rates,
      timestamp: rateCache.timestamp,
      cachedAge: Date.now() - rateCache.timestamp
    };
  } catch (error) {
    console.error('❌ Get all rates error:', error);
    throw error;
  }
}

/**
 * Format currency amount with symbol
 * @param {Number} amount - Amount to format
 * @param {String} currency - Currency code
 * @returns {String} - Formatted currency string
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

  const symbol = symbols[currency] || currency;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);

  return `${symbol}${formattedAmount}`;
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
 * Clear exchange rate cache (for testing or forced refresh)
 */
export function clearRateCache() {
  rateCache = {
    rates: null,
    timestamp: null,
    baseCurrency: 'USD'
  };
  console.log('✅ Exchange rate cache cleared');
}
