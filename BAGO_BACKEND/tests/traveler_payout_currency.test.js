import { describe, expect, it, vi } from 'vitest';

vi.mock('../lib/postgres/db.js', () => ({ query: vi.fn(), queryOne: vi.fn(), withTransaction: vi.fn() }));
const { travelerPayoutCurrency } = await import('../lib/postgres/shipping.js');

describe('travelerPayoutCurrency', () => {
  it('uses the trip currency, not the payment currency', () => {
    expect(travelerPayoutCurrency({ trip_currency: 'ngn', currency: 'EUR' })).toBe('NGN');
  });
  it('falls back to the payment currency when the trip has none', () => {
    expect(travelerPayoutCurrency({ currency: 'eur' })).toBe('EUR');
  });
});
