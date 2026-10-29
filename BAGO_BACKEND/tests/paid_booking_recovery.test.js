import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  query: vi.fn(), queryOne: vi.fn(), finalize: vi.fn(), byRef: vi.fn(), markVerified: vi.fn(),
  retrieve: vi.fn(), completeStripe: vi.fn(),
}));
vi.mock('../lib/postgres/db.js', () => ({ query: m.query, queryOne: m.queryOne }));
vi.mock('../lib/postgres/flutterwavePayments.js', () => ({ markPaymentVerified: m.markVerified }));
vi.mock('../services/flutterwaveService.js', () => ({ verifyTransactionByReference: m.byRef }));
vi.mock('../services/stripeBookingCompletion.js', () => ({ completeStripeBooking: m.completeStripe }));
vi.mock('../controllers/postgresRequestController.js', () => ({ finalizePaidBooking: m.finalize, RequestPackage: vi.fn() }));
vi.mock('../controllers/StripeController.js', () => ({ retrieveStripePaymentIntent: m.retrieve }));

import { recoverFlutterwavePayment, recoverPaidBookings } from '../services/paidBookingRecovery.js';

const flutterwavePayment = {
  id: 'pay-1', user_id: 'sender-1', amount: '45000.00', currency: 'ngn',
  raw_response: { id: 987654, txRef: 'BAGO-PAY-1', packageId: 'pkg-1', tripId: 'trip-1',
    authoritativePreview: { insuranceAmount: 3000 } },
};

beforeEach(() => {
  vi.clearAllMocks();
  m.queryOne.mockResolvedValue({ user_id: 'traveller-1' });
  m.finalize.mockResolvedValue({ status: 'created' });
  m.query.mockResolvedValue({ rows: [] });
});

describe('recovering a paid Flutterwave booking', () => {
  it('books it for the payer, with the traveller from the trip and the verified transaction id', async () => {
    await expect(recoverFlutterwavePayment(flutterwavePayment)).resolves.toEqual({ status: 'created' });
    expect(m.finalize).toHaveBeenCalledWith('sender-1', {
      packageId: 'pkg-1', tripId: 'trip-1', travelerId: 'traveller-1', amount: 45000, currency: 'NGN',
      insurance: true, insuranceCost: 3000, paymentProvider: 'flutterwave', paymentReference: '987654',
    });
  });

  it('carries additional-weight payments to their shipment request', async () => {
    await recoverFlutterwavePayment({ ...flutterwavePayment, raw_response: { ...flutterwavePayment.raw_response, requestId: 'req-1', additionalKg: '2' } });
    expect(m.finalize.mock.calls[0][1]).toMatchObject({ requestId: 'req-1', additionalKg: 2 });
  });

  it('skips payments that never recorded what they were for', async () => {
    await expect(recoverFlutterwavePayment({ ...flutterwavePayment, raw_response: { id: 1 } })).resolves.toEqual({ status: 'skipped' });
    expect(m.finalize).not.toHaveBeenCalled();
  });
});

describe('the recovery job', () => {
  it('confirms payments Flutterwave never reported, then books every verified payment without a booking', async () => {
    m.query
      .mockResolvedValueOnce({ rows: [{ provider_reference: 'BAGO-PAY-2' }] })
      .mockResolvedValueOnce({ rows: [flutterwavePayment] })
      .mockResolvedValueOnce({ rows: [] });
    m.byRef.mockResolvedValue({ success: true, data: { id: 111, txRef: 'BAGO-PAY-2', amount: 10, currency: 'NGN' } });
    await expect(recoverPaidBookings()).resolves.toEqual({ confirmed: 1, created: 1, failed: 0 });
    expect(m.markVerified).toHaveBeenCalledWith(expect.objectContaining({ providerReference: 'BAGO-PAY-2', status: 'verified' }));
    expect(m.finalize).toHaveBeenCalledTimes(1);
  });

  it('finishes succeeded Stripe payments whose webhook never created the booking', async () => {
    m.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'pay-s', stripe_payment_intent_id: 'pi_1' }, { id: 'pay-t', stripe_payment_intent_id: 'pi_2' }] });
    m.retrieve.mockImplementation(async (id) => ({ id, status: id === 'pi_1' ? 'succeeded' : 'requires_payment_method' }));
    await expect(recoverPaidBookings()).resolves.toEqual({ confirmed: 0, created: 1, failed: 0 });
    expect(m.completeStripe).toHaveBeenCalledTimes(1);
    expect(m.completeStripe.mock.calls[0][0].id).toBe('pi_1');
  });

  it('keeps going and reports a booking that could not be created', async () => {
    m.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [flutterwavePayment, { ...flutterwavePayment, id: 'pay-2' }] })
      .mockResolvedValueOnce({ rows: [] });
    m.finalize.mockResolvedValueOnce({ status: 'failed', code: 403, result: { message: 'KYC required' } }).mockResolvedValueOnce({ status: 'created' });
    await expect(recoverPaidBookings()).resolves.toEqual({ confirmed: 0, created: 1, failed: 1 });
  });
});
