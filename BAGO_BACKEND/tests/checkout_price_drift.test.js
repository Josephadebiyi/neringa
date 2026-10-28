import { describe, expect, it } from 'vitest';
import { acceptQuotedAmount } from '../services/checkoutPriceDrift.js';
import { decodeStripeQuote, encodeStripeQuote } from '../services/stripeCheckoutRules.js';

const quote = {travelerCurrency: 'EUR', senderCurrency: 'NGN', travelerPayout: 100,
  convertedTravelerPayout: 160000, platformFee: 20000, processingFee: 4000, fxBuffer: 2000,
  shippingAmount: 186000, insuranceAmount: 3000, totalAmount: 189000, bagoNetRevenue: 26000, exchangeRate: 1600};

describe('checkout price drift', () => {
  it('returns the fresh quote untouched when amounts match', () => {
    expect(acceptQuotedAmount(quote, 189000)).toBe(quote);
  });

  it('rebases a small FX move onto Bago revenue and keeps the traveler payout', () => {
    const rebased = acceptQuotedAmount(quote, 187500);
    expect(rebased.totalAmount).toBe(187500);
    expect(rebased.shippingAmount).toBe(184500);
    expect(rebased.bagoNetRevenue).toBe(24500);
    expect(rebased.convertedTravelerPayout).toBe(160000);
    expect(rebased.insuranceAmount).toBe(3000);
    expect(decodeStripeQuote(encodeStripeQuote(rebased))).not.toBeNull();
  });

  it('rejects a move beyond the tolerance', () => {
    expect(acceptQuotedAmount(quote, 150000)).toBeNull();
    expect(acceptQuotedAmount(quote, 230000)).toBeNull();
  });

  it('never lets the drift come out of the traveler payout', () => {
    expect(acceptQuotedAmount({...quote, bagoNetRevenue: 100}, 187500)).toBeNull();
  });

  it('rejects missing or invalid amounts', () => {
    expect(acceptQuotedAmount(quote, 0)).toBeNull();
    expect(acceptQuotedAmount(quote, 'abc')).toBeNull();
    expect(acceptQuotedAmount(null, 100)).toBeNull();
  });
});
