import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({ client: { query: vi.fn() } }));
vi.mock('../lib/postgres/db.js', () => ({
  query: vi.fn(), queryOne: vi.fn(), withTransaction: async (fn) => fn(m.client),
}));

import { settleWithdrawal, withdrawalStatusForTransfer } from '../services/withdrawalSettlement.js';

let db;
beforeEach(() => {
  vi.clearAllMocks();
  db = {
    balance: 0,
    tx: { id: 'wt-1', user_id: 'u1', wallet_id: 'wallet-1', amount: '50000', currency: 'NGN', status: 'processing', metadata: { reference: 'BAGO-WD-1' } },
  };
  m.client.query.mockImplementation(async (sql, params = []) => {
    if (sql.includes('FOR UPDATE')) {
      const match = sql.includes('id = $1') ? params[0] === db.tx.id : params[0] === db.tx.metadata.reference;
      return { rows: match ? [{ ...db.tx }] : [] };
    }
    if (sql.includes('available_balance + $2')) { db.balance += params[1]; return { rows: [{ id: 'wallet-1' }] }; }
    if (sql.includes('UPDATE public.wallet_transactions')) {
      db.tx = { ...db.tx, status: params[1], metadata: JSON.parse(params[2]) };
      return { rows: [] };
    }
    return { rows: [] };
  });
});

describe('settling a Flutterwave payout', () => {
  it('refunds the wallet when a transfer that was accepted later fails', async () => {
    const result = await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'FAILED', source: 'flutterwave_webhook' });
    expect(result).toMatchObject({ changed: true, refunded: true, status: 'failed' });
    expect(db.balance).toBe(50000);
    expect(db.tx.metadata).toMatchObject({ refunded: true, refundSource: 'flutterwave_webhook' });
  });

  it('never refunds twice when the webhook is delivered again or an admin syncs', async () => {
    await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'FAILED' });
    const again = await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'FAILED' });
    const sync = await settleWithdrawal({ transactionId: 'wt-1', providerStatus: 'FAILED', source: 'admin_sync' });
    expect(again.refunded).toBe(false);
    expect(sync.refunded).toBe(false);
    expect(db.balance).toBe(50000);
  });

  it('marks a successful transfer completed without touching the wallet', async () => {
    const result = await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'SUCCESSFUL' });
    expect(result).toMatchObject({ changed: true, refunded: false, status: 'completed' });
    expect(db.balance).toBe(0);
  });

  it('refunds a payout that was completed and then reversed by the bank', async () => {
    await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'SUCCESSFUL' });
    const result = await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'REVERSED' });
    expect(result.refunded).toBe(true);
    expect(db.balance).toBe(50000);
    expect(db.tx.metadata.reversed).toBe(true);
  });

  it('does not refund a failure reported after the payout was already completed', async () => {
    await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'SUCCESSFUL' });
    const result = await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'FAILED' });
    expect(result.refunded).toBe(false);
    expect(db.balance).toBe(0);
  });

  it('does not refund what an admin already refunded', async () => {
    db.tx.metadata.adminRefunded = true;
    const result = await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'FAILED' });
    expect(result.refunded).toBe(false);
    expect(db.balance).toBe(0);
  });

  it('ignores statuses that are not final yet', async () => {
    expect(withdrawalStatusForTransfer('NEW')).toBeNull();
    expect(withdrawalStatusForTransfer('PENDING')).toBeNull();
    const result = await settleWithdrawal({ reference: 'BAGO-WD-1', providerStatus: 'PENDING' });
    expect(result.changed).toBe(false);
  });
});
