// utils/insuranceCalculator.js
// Dynamic insurance pricing logic - same price all routes, all currencies

import { convertCurrency, getExchangeRates } from './exchangeRateCache.js';

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
 * @returns {Promise<Object>} - Insurance calculation result
 */
export async function calculateInsurance(itemValue, currencyCode = 'USD') {
  try {
    // Validate inputs
    if (!itemValue || isNaN(itemValue) || itemValue < 0) {
      throw new Error('Invalid item value');
    }

    if (!currencyCode || typeof currencyCode !== 'string') {
      throw new Error('Invalid currency code');
    }

    const currency = currencyCode.toUpperCase();

    // Step 1: Convert item value to USD for threshold comparison
    let itemValueUSD = itemValue;

    if (currency !== 'USD') {
      itemValueUSD = await convertCurrency(itemValue, currency, 'USD');
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
      insurancePrice = await convertCurrency(insurancePriceUSD, 'USD', currency);
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
    throw new Error(`Insurance calculation error: ${error.message}`);
  }
}

/**
 * Validate insurance price submitted by client
 * Allows ±0.10 tolerance in user's currency for rounding differences
 *
 * @param {number} clientPrice - Insurance price submitted by client
 * @param {number} itemValue - Item value
 * @param {string} currency - Currency code
 * @returns {Promise<Object>} - Validation result
 */
export async function validateInsurancePrice(clientPrice, itemValue, currency) {
  try {
    const serverCalc = await calculateInsurance(itemValue, currency);
    const serverPrice = serverCalc.insurancePrice;

    const difference = Math.abs(clientPrice - serverPrice);
    const tolerance = 0.10; // Allow ±0.10 in user's currency

    const isValid = difference <= tolerance;

    return {
      isValid,
      serverPrice,
      clientPrice,
      difference,
      tolerance,
      message: isValid
        ? 'Insurance price validated'
        : `Insurance price mismatch. Expected ${serverPrice} ${currency}, got ${clientPrice} ${currency}`,
    };

  } catch (error) {
    console.error('❌ Insurance price validation failed:', error.message);
    return {
      isValid: false,
      message: `Validation error: ${error.message}`,
    };
  }
}
