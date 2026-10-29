import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ query: vi.fn(), queryOne: vi.fn(), getRequest: vi.fn(), refund: vi.fn(), permission: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ query: m.query, queryOne: m.queryOne }));
vi.mock('../lib/postgres/shipping.js', () => ({ getShipmentRequestById: m.getRequest, setExternalTracking: vi.fn() }));
vi.mock('../services/shipmentRefundService.js', () => ({ refundPaidShipmentRequest: m.refund }));
vi.mock('../services/supportAutomationService.js', () => ({ adminHasPermission: m.permission }));
vi.mock('../services/pushNotificationService.js', () => ({ sendPushNotification: vi.fn().mockResolvedValue([]) }));
vi.mock('../services/pdfGenerator.js', () => ({ generateShippingLabelPDF: vi.fn() }));
vi.mock('../services/trackingNumber.js', () => ({ ensureTrackingNumber: vi.fn() }));
import { adminCancelRequest, updateRequest } from '../controllers/AdminControllers/Tracking.js';
const order = { id: 'order', status: 'pending', movement_tracking: [] };
function response() { return { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } }; }
beforeEach(() => {
  vi.clearAllMocks();
  m.getRequest.mockResolvedValue({ ...order });
  m.queryOne.mockResolvedValue({ ...order });
  m.query.mockResolvedValue({ rows: [] });
  m.permission.mockReturnValue(true);
  m.refund.mockResolvedValue({ provider: 'stripe', status: 'pending', reference: 're_one' });
});
describe('mandatory admin rejection refunds', () => {
  it.each([false, undefined])('cancellation triggers original-processor refund even when issueRefund=%s', async issueRefund => {
    const res = response(), next = vi.fn();
    await adminCancelRequest({ params: { id: 'order' }, body: { issueRefund }, admin: {} }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.code).toBe(200);
    expect(m.refund).toHaveBeenCalledWith(expect.objectContaining({ id: 'order' }), { reason: 'admin_cancelled' });
    expect(res.data.refundInfo.provider).toBe('stripe');
  });
  it.each(['rejected', 'cancelled'])('generic status update to %s cannot bypass refund', async status => {
    const res = response(), next = vi.fn();
    await updateRequest({ params: { id: 'order' }, body: { status }, admin: {} }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.code).toBe(200);
    expect(m.refund).toHaveBeenCalledTimes(1);
    expect(res.data.refundInfo.reference).toBe('re_one');
  });
  it('reports refund failure rather than a successful cancellation', async () => {
    m.refund.mockRejectedValue(new Error('uncertain processor response'));
    const res = response();
    await adminCancelRequest({ params: { id: 'order' }, body: {}, admin: {} }, res, vi.fn());
    expect(res.code).toBe(502);
    expect(res.data).toMatchObject({ success: false, refundFailed: true });
  });
  it('cannot bypass refund permissions by deselecting refund', async () => {
    m.permission.mockReturnValue(false);
    const res = response();
    await adminCancelRequest({ params: { id: 'order' }, body: { issueRefund: false }, admin: {} }, res, vi.fn());
    expect(res.code).toBe(403);
    expect(m.queryOne).not.toHaveBeenCalled();
    expect(m.refund).not.toHaveBeenCalled();
  });
  it('allows a repeated cancelled request to reach the deduplicated refund service', async () => {
    m.getRequest.mockResolvedValue({ ...order, status: 'cancelled' });
    const res = response();
    await adminCancelRequest({ params: { id: 'order' }, body: {}, admin: {} }, res, vi.fn());
    expect(res.code).toBe(200);
    expect(m.refund).toHaveBeenCalledTimes(1);
  });
});
