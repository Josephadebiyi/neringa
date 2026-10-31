import { describe, expect, it } from 'vitest';
import { netForTraveler, travelerEarningIn } from '../services/travelerEarnings.js';

const convert = async (amount, from, to) => (from === 'EUR' && to === 'NGN' ? amount * 1700 : amount / 1700);

describe('traveler earning = paid minus insurance and fees, in their currency', () => {
  it('removes insurance and the 15% commission', () => {
    // sender paid 117.30 incl. 2.30 insurance: (117.30 - 2.30) / 1.15 = 100
    expect(netForTraveler({ amountPaid: 117.3, insuranceCost: 2.3, multiplier: 1.15 })).toBe(100);
  });

  it('converts from the payment currency into the traveler currency', async () => {
    const r = await travelerEarningIn({ amountPaid: 115, paymentCurrency: 'EUR', toCurrency: 'NGN', multiplier: 1.15, convert });
    expect(r).toEqual({ amount: 170000, currency: 'NGN', netInPaymentCurrency: 100 });
  });

  it('needs no conversion when both currencies match', async () => {
    const r = await travelerEarningIn({ amountPaid: 115, paymentCurrency: 'ngn', toCurrency: 'NGN', multiplier: 1.15, convert });
    expect(r.amount).toBe(100);
  });

  it('subtracts the fees actually charged when the booking has them', () => {
    expect(netForTraveler({ amountPaid: 175000, fees: { platformCommission: 22500, processingFee: 2500, fxBuffer: 0 }, multiplier: 1.15 })).toBe(150000);
  });

  it('never goes negative', () => {
    expect(netForTraveler({ amountPaid: 5, insuranceCost: 10, multiplier: 1.15 })).toBe(0);
  });
});
