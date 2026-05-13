/**
 * Centralized Commission Configuration for the Bago Platform
 */

// Default platform commission rate (10% = 0.10)
export const PLATFORM_COMMISSION_RATE = 0.10;

// High-risk or regional commission adjustments can be defined here
export const REGIONAL_COMMISSION_RATES = {
  GLOBAL: 0.10,
  AFRICA: 0.10,
  EUROPE: 0.10,
};

/**
 * Get the effective commission rate based on transaction metadata
 */
export function getEffectiveCommissionRate(metadata = {}) {
  // If we ever need dynamic rates based on country or user tier,
  // this is the central place to implement it.
  return PLATFORM_COMMISSION_RATE;
}
