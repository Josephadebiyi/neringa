import { describe, it, expect } from 'vitest';
import { calculateInsurance } from '../../BAGO_WEBAPP/src/utils/insuranceCalculator.js';

const rates = { USD: 1, EUR: 0.92, GBP: 0.79, NGN: 1550, GHS: 15.2 };

describe('calculateInsurance — 0.5% of item value', () => {
  it('charges 0.5% for a $100 item in USD', () => {
    const result = calculateInsurance(100, 'USD', rates);
    expect(result.insurancePrice).toBeCloseTo(0.5, 2);
    expect(result.threshold).toBe('0.5%');
  });

  it('charges 0.5% for a $200 item in USD', () => {
    const result = calculateInsurance(200, 'USD', rates);
    expect(result.insurancePrice).toBeCloseTo(1.0, 2);
  });

  it('charges 0.5% for a $10 item in USD', () => {
    const result = calculateInsurance(10, 'USD', rates);
    expect(result.insurancePrice).toBeCloseTo(0.05, 2);
  });

  it('converts NGN item value to USD before calculating 0.5%', () => {
    const ngnValue = 155000; // = $100 USD
    const result = calculateInsurance(ngnValue, 'NGN', rates);
    // 0.5% of $100 = $0.50, converted to NGN = 0.50 * 1550 = 775
    expect(result.insurancePrice).toBeCloseTo(775, 0);
  });

  it('returns result in the user currency', () => {
    const result = calculateInsurance(1000, 'EUR', rates);
    expect(result.currency).toBe('EUR');
    // 1000 EUR → USD: 1000/0.92 ≈ 1086.96 → 0.5% ≈ 5.43 USD → EUR: 5.43*0.92 ≈ 5.0
    expect(result.insurancePrice).toBeCloseTo(5.0, 0);
  });

  it('returns error for invalid item value', () => {
    const result = calculateInsurance(-50, 'USD', rates);
    expect(result.error).toBeDefined();
    expect(result.insurancePrice).toBe(0);
  });

  it('returns error for zero item value', () => {
    const result = calculateInsurance(0, 'USD', rates);
    expect(result.error).toBeDefined();
  });

  it('falls back gracefully when no exchange rates provided', () => {
    const result = calculateInsurance(500, 'USD', {});
    expect(result.warning).toBeDefined();
    // Fallback: 0.5% of 500 = 2.5
    expect(result.insurancePrice).toBeCloseTo(2.5, 2);
  });
});
