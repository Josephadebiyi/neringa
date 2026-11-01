import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ queryOne: vi.fn(), convert: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ query: vi.fn(), queryOne: m.queryOne, withTransaction: vi.fn() }));
vi.mock('../lib/postgres/profiles.js', () => ({ findProfileById: vi.fn(), getWalletByUserId: vi.fn() }));
vi.mock('../services/currencyConverter.js', () => ({ convertCurrency: m.convert }));
vi.mock('../services/pricingService.js', () => ({ getFullPricingConfig: vi.fn(async () => ({})) }));

import { getTravelerEarningForRequest, isCurrencyScaleMismatch } from '../lib/postgres/accounts.js';

// Sender in Spain paid EUR 80.00 for a Lagos -> Barcelona delivery; Bago kept
// EUR 11.21 in fees, so the traveler earns EUR 68.79 = NGN 110,064 at 1,600.
const request = {
  id: 'req-1', travelerId: 'trav-1', amount: 80, currency: 'EUR',
  platformCommission: 10, processingFee: 1.21, fxBuffer: 0,
};
let held;
let walletCurrency;

beforeEach(() => {
  vi.clearAllMocks();
  walletCurrency = 'NGN';
  m.convert.mockImplementation(async (amount, from, to) => {
    if (from === to) return amount;
    if (from === 'EUR' && to === 'NGN') return amount * 1600;
    if (from === 'NGN' && to === 'EUR') return amount / 1600;
    throw new Error(`no rate ${from}->${to}`);
  });
  m.queryOne.mockImplementation(async (sql) => {
    if (sql.includes("type = 'escrow_hold'")) return held;
    if (sql.includes('from public.profiles p')) return { currency: walletCurrency };
    return null;
  });
});

describe("traveler's earning on a booking paid in another currency", () => {
  it('shows the euro payment converted into the NGN wallet when the escrow hold is correct', async () => {
    held = { amount: '110064.00', currency: 'NGN' };
    await expect(getTravelerEarningForRequest(request)).resolves.toEqual({ amount: 110064, currency: 'NGN' });
  });

  it('does not show "NGN 68.79" when an older hold stored the euro figure under NGN', async () => {
    held = { amount: '68.79', currency: 'NGN' };
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(getTravelerEarningForRequest(request)).resolves.toEqual({
      amount: 110064, currency: 'NGN', escrowMismatch: true,
    });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('req-1'));
    warn.mockRestore();
  });

  it('converts a hold made before the wallet currency changed into the current wallet currency', async () => {
    held = { amount: '68.79', currency: 'EUR' };
    const result = await getTravelerEarningForRequest(request);
    expect(result.currency).toBe('NGN');
    expect(result.amount).toBeCloseTo(110064, 0);
  });

  it('computes the earning in the wallet currency before payment is confirmed', async () => {
    held = { amount: '0', currency: null };
    await expect(getTravelerEarningForRequest(request)).resolves.toEqual({ amount: 110064, currency: 'NGN' });
  });
});

describe('isCurrencyScaleMismatch', () => {
  it('ignores normal fee and rate differences', () => {
    expect(isCurrencyScaleMismatch(100, 120)).toBe(false);
    expect(isCurrencyScaleMismatch(250, 100)).toBe(false);
  });

  it('flags amounts that are really in another currency', () => {
    expect(isCurrencyScaleMismatch(68.79, 110064)).toBe(true);
    expect(isCurrencyScaleMismatch(110064, 68.79)).toBe(true);
  });
});
