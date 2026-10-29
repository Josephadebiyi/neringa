import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ transaction: vi.fn(), flutterwave: vi.fn(), retrieve: vi.fn(), refund: vi.fn(), cancel: vi.fn(), reversal: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ withTransaction: m.transaction }));
vi.mock('../services/flutterwaveService.js', () => ({ refundTransaction: m.flutterwave }));
vi.mock('stripe', () => ({ default: class {
  paymentIntents = { retrieve: m.retrieve, cancel: m.cancel };
  refunds = { create: m.refund };
  transfers = { createReversal: m.reversal };
} }));
import { refundPaidShipmentRequest } from '../services/shipmentRefundService.js';
let row, client, escrowReversals, queue, ledger;
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_refund');
  row = { id: 'request', sender_id: 'sender', amount: 100, payment_status: 'paid_escrow', stripe_payment_intent_id: 'pi_paid',
    payment_info: { gateway: 'stripe', requestId: 'pi_paid', status: 'paid_escrow' } };
  escrowReversals = 0; ledger = new Map();
  client = { query: vi.fn(async (sql, args) => {
    if (sql.includes('select request_id, refund_info from public.shipment_refund_attempts')) return { rows: ledger.has(args[0] + args[1]) ? [structuredClone(ledger.get(args[0] + args[1]))] : [] };
    if (sql.includes('insert into public.shipment_refund_attempts')) {
      const key = args[0] + args[1];
      if (ledger.has(key)) throw new Error('duplicate payment refund');
      ledger.set(key, { request_id: args[2], refund_info: JSON.parse(args[3]) });
    }
    if (sql.includes('update public.shipment_refund_attempts')) {
      const entry = ledger.get(args[0] + args[1]);
      if (entry) entry.refund_info = JSON.parse(args[2]);
    }
    if (sql.startsWith('select * from public.shipment_requests')) return { rows: [structuredClone(row)] };
    if (sql.includes('payment_info = coalesce')) Object.assign(row.payment_info, JSON.parse(args[1]));
    if (sql.includes('select fast_payout_released_at')) return { rows: [{}] };
    if (sql.includes('from public.wallet_transactions')) return { rows: [{ id: 'hold', wallet_id: 'wallet', amount: 80, currency: 'EUR' }] };
    if (sql.includes('insert into public.wallet_transactions')) escrowReversals++;
    if (sql.includes('set payment_status =')) row.payment_status = args[1];
    return { rows: [] };
  }) };
  // Serialize transaction sections like PostgreSQL's row locks, but leave
  // processor calls outside that lock so concurrency races are exercised.
  queue = Promise.resolve();
  m.transaction.mockImplementation(work => {
    const pending = queue.then(() => work(client));
    queue = pending.catch(() => {});
    return pending;
  });
  m.retrieve.mockResolvedValue({ id: 'pi_paid', status: 'succeeded', amount_received: 10000,
    metadata: { senderId: 'sender' }, latest_charge: { amount_refunded: 0 } });
  m.refund.mockResolvedValue({ id: 're_paid', status: 'succeeded', amount: 10000 });
  m.flutterwave.mockResolvedValue({ success: true, id: 91, status: 'pending' });
});

describe('original processor refunds with durable duplicate protection', () => {
  it('refunds Stripe through the original intent and reverses escrow only once', async () => {
    const result = await refundPaidShipmentRequest({ id: row.id });
    expect(result).toMatchObject({ provider: 'stripe', status: 'succeeded', reference: 're_paid' });
    expect(m.refund).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: 'pi_paid' }), { idempotencyKey: 'bago-shipment-refund-request' });
    expect(m.flutterwave).not.toHaveBeenCalled();
    expect(row.payment_status).toBe('refunded');
    expect(await refundPaidShipmentRequest({ id: row.id })).toEqual(result);
    expect(m.refund).toHaveBeenCalledTimes(1);
    expect(escrowReversals).toBe(1);
  });
  it('uses the original numeric Flutterwave ID, keeps pending distinct from completed', async () => {
    row.stripe_payment_intent_id = null;
    row.payment_info = { gateway: 'flutterwave', requestId: '12345' };
    const result = await refundPaidShipmentRequest({ id: row.id }, { reason: 'admin_cancelled' });
    expect(result).toMatchObject({ provider: 'flutterwave', status: 'pending' });
    expect(m.flutterwave).toHaveBeenCalledWith('12345', expect.any(Object));
    expect(m.refund).not.toHaveBeenCalled();
    await refundPaidShipmentRequest({ id: row.id });
    expect(m.flutterwave).toHaveBeenCalledTimes(1);
    expect(escrowReversals).toBe(1);
    expect(row.payment_status).toBe('refund_pending');
  });
  it.each(['stripe', 'flutterwave'])('blocks concurrent admin/traveller attempts for %s', async provider => {
    if (provider === 'flutterwave') { row.stripe_payment_intent_id = null; row.payment_info = { gateway: provider, requestId: '12345' }; }
    const gateway = provider === 'stripe' ? m.refund : m.flutterwave;
    let release;
    gateway.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const first = refundPaidShipmentRequest({ id: row.id });
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('already being checked');
    release(provider === 'stripe' ? { id: 're_one', status: 'succeeded', amount: 10000 } : { success: true, id: 91, status: 'pending' });
    await first;
    expect(gateway).toHaveBeenCalledTimes(1);
    expect(escrowReversals).toBe(1);
  });
  it('never resubmits after a processor timeout or process restart', async () => {
    m.refund.mockRejectedValue(new Error('timeout after remote acceptance'));
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('reconciliation');
    expect(row.payment_info.refund.status).toBe('reconciliation_required');
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('already being checked');
    expect(m.refund).toHaveBeenCalledTimes(1);
    expect(escrowReversals).toBe(0);
  });
  it('never reissues after the processor accepts but final database write fails', async () => {
    const original = client.query.getMockImplementation();
    let failOnce = true;
    client.query.mockImplementation(async (sql, args) => {
      if (sql.startsWith('select id from public.shipment_requests') && failOnce && m.refund.mock.calls.length > 0) {
        failOnce = false; throw new Error('database connection lost');
      }
      return original(sql, args);
    });
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('reconciliation');
    row.payment_info = { gateway: 'stripe', requestId: 'pi_paid' };
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('already exists');
    expect(m.refund).toHaveBeenCalledTimes(1);
  });
  it('a durable initiating reservation survives an interrupted request', async () => {
    row.payment_info.refund = { status: 'initiating', provider: 'stripe', paymentReference: 'pi_paid' };
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('already being checked');
    expect(m.refund).not.toHaveBeenCalled();
  });
  it('respects old endpoint refund markers', async () => {
    row.stripe_refund_id = 're_legacy';
    expect(await refundPaidShipmentRequest({ id: row.id })).toMatchObject({ legacy: true });
    expect(m.retrieve).not.toHaveBeenCalled();
  });
  it('does not refund again when Stripe reports an existing external refund', async () => {
    m.retrieve.mockResolvedValue({ id: 'pi_paid', status: 'succeeded', latest_charge: { amount_refunded: 5000 } });
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('reconciliation');
    expect(m.refund).not.toHaveBeenCalled();
  });
  it('releases an uncaptured authorization instead of creating a refund', async () => {
    m.retrieve.mockResolvedValue({ id: 'pi_paid', status: 'requires_capture' });
    expect(await refundPaidShipmentRequest({ id: row.id })).toMatchObject({ authorizationReleased: true });
    expect(m.cancel).toHaveBeenCalledTimes(1);
    expect(m.refund).not.toHaveBeenCalled();
  });
  it('fails visibly for unsupported paid processors and invalid Flutterwave references', async () => {
    row.stripe_payment_intent_id = null;
    row.payment_info = { gateway: 'unknown', requestId: 'ref' };
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('original payment');
    row.payment_info = { gateway: 'flutterwave', requestId: 'tx-ref-not-numeric' };
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('transaction ID');
    expect(m.flutterwave).not.toHaveBeenCalled();
  });
  it('cannot duplicate a refund even if payment metadata is overwritten', async () => {
    await refundPaidShipmentRequest({ id: row.id });
    row.payment_info = { gateway: 'stripe', requestId: 'pi_paid' };
    row.payment_status = 'paid_escrow';
    expect(await refundPaidShipmentRequest({ id: row.id })).toMatchObject({ reference: 're_paid' });
    expect(m.refund).toHaveBeenCalledTimes(1);
  });
  it('rejects the same payment attached to another shipment', async () => {
    await refundPaidShipmentRequest({ id: row.id });
    row.id = 'another-request'; row.payment_info = { gateway: 'stripe', requestId: 'pi_paid' }; row.payment_status = 'paid_escrow';
    await expect(refundPaidShipmentRequest({ id: row.id })).rejects.toThrow('already exists');
    expect(m.refund).toHaveBeenCalledTimes(1);
  });
  it('does not call any processor for an unpaid draft' , async () => {
    row.stripe_payment_intent_id = null; row.payment_info = {}; row.payment_status = 'pending_payment';
    expect(await refundPaidShipmentRequest({ id: row.id })).toBeNull();
    expect(m.refund).not.toHaveBeenCalled();
  });
});
