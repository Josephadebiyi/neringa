import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ job: null, pgQuery: vi.fn(), client: { query: vi.fn() } }));
vi.mock('node-cron', () => ({ default: { schedule: (_spec, fn) => { m.job = fn; } } }));
vi.mock('../lib/postgres/db.js', () => ({
  query: m.pgQuery, withTransaction: async (fn) => fn(m.client),
}));

import { startEscrowAutoRelease } from '../cron/escrowCron.js';

const twoDaysAgo = new Date(Date.now() - 49 * 3600 * 1000).toISOString();
let db;

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  db = { available: 0, escrow: 110000, earning: false, holds: [100000, 10000], released: false, senderConfirmed: false };
  m.pgQuery.mockImplementation(async (sql) => {
    if (sql.includes('FROM public.shipment_requests')) {
      return { rows: [{ id: 'req-1', traveler_id: 'trav-1', sender_id: 's-1', amount: 80, currency: 'EUR', updated_at: twoDaysAgo }] };
    }
    return { rows: [] };
  });
  m.client.query.mockImplementation(async (sql, params = []) => {
    if (sql.includes('FROM public.wallet_accounts WHERE user_id = $1 FOR UPDATE')) return { rows: [{ id: 'wallet-1', currency: 'NGN' }] };
    if (sql.includes('FROM public.shipment_requests') && sql.includes('FOR UPDATE')) {
      return { rows: db.released || db.senderConfirmed ? [] : [{ id: 'req-1', tracking_number: 'BAGO-1', trip_id: 'trip-1' }] };
    }
    if (sql.includes("type = 'earning'") && sql.includes('SELECT')) return { rows: db.earning ? [{ id: 'e-1' }] : [] };
    if (sql.includes("type = 'escrow_hold'")) {
      return { rows: [{ amount: db.holds.reduce((a, b) => a + b, 0), currency: 'NGN' }] };
    }
    if (sql.includes('available_balance = available_balance + $2')) { db.available += params[1]; db.escrow -= params[1]; return { rows: [] }; }
    if (sql.includes('INSERT INTO public.wallet_transactions')) { db.earning = true; return { rows: [] }; }
    if (sql.includes('SET auto_released = true')) { db.released = true; return { rows: [] }; }
    return { rows: [] };
  });
  startEscrowAutoRelease();
});

describe('escrow auto-release after 48 hours', () => {
  it('pays every escrow hold (including extra kg) and records the payment', async () => {
    await m.job();
    expect(db.available).toBe(110000);
    expect(db.escrow).toBe(0);
    expect(db.earning).toBe(true);
    expect(db.released).toBe(true);
  });

  it('never pays a booking a second time', async () => {
    await m.job();
    db.released = false; // even if the flag were missed, the earning record stops it
    await m.job();
    expect(db.available).toBe(110000);
  });

  it('skips a booking another path already paid', async () => {
    db.earning = true;
    await m.job();
    expect(db.available).toBe(0);
  });

  it('does not guess an amount when nothing is held in escrow', async () => {
    db.holds = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await m.job();
    expect(db.available).toBe(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('no escrow hold'));
  });
});
