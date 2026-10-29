import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  query: vi.fn(), queryOne: vi.fn(), markVerified: vi.fn(), byRef: vi.fn(),
  completeStripe: vi.fn(), recoverFw: vi.fn(), retrieve: vi.fn(),
}));
vi.mock('../lib/postgres/db.js', () => ({ query: m.query, queryOne: m.queryOne }));
vi.mock('../lib/postgres/flutterwavePayments.js', () => ({ markPaymentVerified: m.markVerified }));
vi.mock('../services/flutterwaveService.js', () => ({ verifyTransactionByReference: m.byRef }));
vi.mock('../services/stripeBookingCompletion.js', () => ({ completeStripeBooking: m.completeStripe }));
vi.mock('../services/paidBookingRecovery.js', () => ({ recoverFlutterwavePayment: m.recoverFw }));
vi.mock('../controllers/postgresRequestController.js', () => ({ RequestPackage: vi.fn() }));
vi.mock('../controllers/StripeController.js', () => ({ retrieveStripePaymentIntent: m.retrieve }));

import { listPayments, retryPaymentBooking } from '../controllers/AdminControllers/PaymentsController.js';

function res() { return { code: 200, status(c) { this.code = c; return this; }, json(d) { this.data = d; return this; }, headersSent: false }; }
const stripeRow = {
  id: 'pay-1', created_at: '2026-10-29T11:37:31Z', provider: 'stripe', payment_method: 'payment_sheet', status: 'succeeded',
  amount: '68.79', currency: 'EUR', stripe_payment_intent_id: 'pi_3UVre', provider_reference: null, shipment_id: null,
  user_id: 'u1', first_name: 'Blessing', last_name: 'O', email: 'b@example.com',
  raw_response: { paymentIntent: { metadata: { packageId: 'pkg', tripId: 'trip', paymentMethodType: 'card' } } },
};

beforeEach(() => { vi.clearAllMocks(); m.query.mockResolvedValue({ rows: [] }); });

describe('admin payments list', () => {
  it('shows each payment with provider, method, reference and whether it needs attention', async () => {
    m.query.mockResolvedValueOnce({ rows: [stripeRow] });
    m.queryOne.mockResolvedValueOnce({ count: 1 });
    const response = res();
    await listPayments({ query: { filter: 'attention' } }, response, vi.fn());
    expect(response.data.needsAttention).toBe(1);
    expect(response.data.data[0]).toMatchObject({
      provider: 'stripe', paymentMethod: 'payment_sheet', status: 'succeeded', amount: 68.79,
      reference: 'pi_3UVre', needsAttention: true, packageId: 'pkg',
      customer: { email: 'b@example.com', name: 'Blessing O' },
    });
    expect(m.query.mock.calls[0][0]).toContain('shipment_id is null');
  });
});

describe('admin retry booking', () => {
  it('books a succeeded Stripe payment', async () => {
    m.queryOne.mockResolvedValueOnce(stripeRow).mockResolvedValueOnce({ shipment_id: 'ship-1' });
    m.retrieve.mockResolvedValue({ id: 'pi_3UVre', status: 'succeeded' });
    const response = res();
    await retryPaymentBooking({ params: { id: 'pay-1' }, admin: { id: 'admin-1' } }, response, vi.fn());
    expect(m.completeStripe).toHaveBeenCalled();
    expect(response.data).toMatchObject({ success: true, shipmentId: 'ship-1' });
  });

  it('refuses to book a Stripe payment that did not succeed', async () => {
    m.queryOne.mockResolvedValueOnce({ ...stripeRow, status: 'requires_payment_method' });
    m.retrieve.mockResolvedValue({ id: 'pi_3UVre', status: 'requires_payment_method' });
    const response = res();
    await retryPaymentBooking({ params: { id: 'pay-1' } }, response, vi.fn());
    expect(response.code).toBe(409);
    expect(m.completeStripe).not.toHaveBeenCalled();
  });

  it('confirms an unconfirmed Flutterwave payment with Flutterwave before booking it', async () => {
    const fw = { id: 'pay-2', user_id: 'u1', provider: 'flutterwave', status: 'initiated', amount: '45000', currency: 'NGN',
      provider_reference: 'BAGO-PAY-1', shipment_id: null, raw_response: { packageId: 'pkg', tripId: 'trip' } };
    m.queryOne.mockResolvedValueOnce(fw).mockResolvedValueOnce({ shipment_id: 'ship-2' });
    m.byRef.mockResolvedValue({ success: true, data: { id: 555, txRef: 'BAGO-PAY-1', amount: 45000, currency: 'NGN' } });
    m.recoverFw.mockResolvedValue({ status: 'created' });
    const response = res();
    await retryPaymentBooking({ params: { id: 'pay-2' } }, response, vi.fn());
    expect(m.markVerified).toHaveBeenCalledWith(expect.objectContaining({ providerReference: 'BAGO-PAY-1', status: 'verified' }));
    expect(m.recoverFw.mock.calls[0][0].raw_response.id).toBe(555);
    expect(response.data).toMatchObject({ success: true, shipmentId: 'ship-2' });
  });

  it('does nothing for a payment that is already booked', async () => {
    m.queryOne.mockResolvedValueOnce({ ...stripeRow, shipment_id: 'ship-9' });
    const response = res();
    await retryPaymentBooking({ params: { id: 'pay-1' } }, response, vi.fn());
    expect(response.data.status).toBe('exists');
    expect(m.retrieve).not.toHaveBeenCalled();
  });
});
