import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findProfileById: vi.fn(),
  checkTermsAccepted: vi.fn(),
  getPackageById: vi.fn(),
}));

vi.mock('../services/emailNotifications.js', () => ({
  sendNewRequestToTravelerEmail: vi.fn(), sendReceiverShipmentAcceptedEmail: vi.fn(),
  sendReceiverShippingStartedEmail: vi.fn(), sendShippingStatusEmail: vi.fn(),
  sendHandoverPINEmail: vi.fn(), sendShipmentLabelEmail: vi.fn(),
}));
vi.mock('../services/pdfGenerator.js', () => ({ generateShippingLabelPDF: vi.fn() }));
vi.mock('../services/pushNotificationService.js', () => ({ sendPushNotification: vi.fn() }));
vi.mock('../lib/postgres/shipping.js', () => ({
  confirmShipmentReceived: vi.fn(), redeemHandoverToken: vi.fn(), createNotification: vi.fn(),
  createShipmentRequestRecord: vi.fn(), getPackageById: mocks.getPackageById,
  getPublicTrackingByNumber: vi.fn(), getShipmentRequestById: vi.fn(), getTripById: vi.fn(),
  listCompletedRequestsByUser: vi.fn(), listDisputedRequests: vi.fn(), listNotificationsForUser: vi.fn(),
  listRecentOrdersForUser: vi.fn(), listIncomingRequestsForTraveler: vi.fn(), listRequestsForTrip: vi.fn(),
  listRequestsForUser: vi.fn(), markAllNotificationsRead: vi.fn(), markNotificationRead: vi.fn(),
  raiseShipmentDispute: vi.fn(), updateDisputeStatus: vi.fn(), updatePaymentInfo: vi.fn(),
  updateRequestImage: vi.fn(), updateShipmentDates: vi.fn(), updateShipmentRequestStatus: vi.fn(),
  updateTravelerProof: vi.fn(), savePackageInspection: vi.fn(),
}));
vi.mock('../lib/postgres/accounts.js', () => ({ holdEscrowForPaidRequest: vi.fn() }));
vi.mock('../lib/postgres/db.js', () => ({ query: vi.fn(), queryOne: vi.fn(), withTransaction: vi.fn() }));
vi.mock('../lib/postgres/tripCapacity.js', () => ({ buildTripCapacitySnapshot: vi.fn(), syncTripCapacity: vi.fn() }));
vi.mock('../controllers/FlutterwaveController.js', () => ({ verifyFlutterwaveTransactionServerSide: vi.fn() }));
vi.mock('../services/shipmentRefundService.js', () => ({ refundPaidShipmentRequest: vi.fn() }));
vi.mock('../services/currencyConverter.js', () => ({ convertCurrency: vi.fn() }));
vi.mock('../controllers/AdminControllers/setting.js', () => ({ getAppSettings: vi.fn() }));
vi.mock('../controllers/SenderOnboardingController.js', () => ({
  checkTermsAccepted: mocks.checkTermsAccepted, getItemCategoryBySlug: vi.fn(),
}));
vi.mock('../lib/postgres/profiles.js', () => ({ findProfileById: mocks.findProfileById }));
vi.mock('../lib/postgres/audit.js', () => ({ createAuditLog: vi.fn() }));
vi.mock('../lib/postgres/operationalRecords.js', () => ({ recordOperationalEvent: vi.fn() }));
vi.mock('../services/myCoverService.js', () => ({ purchaseMyCoverPolicy: vi.fn() }));
vi.mock('../services/myCoverPricing.js', () => ({ getRouteProtectionFee: vi.fn() }));
vi.mock('../services/referralService.js', () => ({ applyReferralShipmentReward: vi.fn() }));

import { RequestPackage } from '../controllers/postgresRequestController.js';

function mockRes() {
  const res = { _code: null, _body: null };
  res.status = (code) => { res._code = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

function verifiedSender() {
  return { id: 'sender-1', phoneVerified: true, kycStatus: 'approved' };
}

const reqBody = {
  travelerId: 'biz-1', packageId: 'pkg-1', tripId: 'trip-1', amount: 100, currency: 'USD',
};

describe('RequestPackage — restricted business trip owners cannot receive new bookings', () => {
  beforeEach(() => {
    mocks.findProfileById.mockReset();
    mocks.checkTermsAccepted.mockReset().mockResolvedValue(true);
    mocks.getPackageById.mockReset();
  });

  it('rejects a booking against a restricted (grace-period-expired, unverified) business trip owner', async () => {
    mocks.findProfileById.mockImplementation(async (id) => {
      if (id === 'sender-1') return verifiedSender();
      if (id === 'biz-1') return {
        id: 'biz-1', accountType: 'company', businessStatus: 'pending_review',
        businessGracePeriodStartedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      };
      return null;
    });

    const req = { body: reqBody, user: { id: 'sender-1' } };
    const res = mockRes();
    await RequestPackage(req, res);

    expect(res._code).toBe(403);
    expect(res._body.code).toBe('BUSINESS_ACCOUNT_RESTRICTED');
    expect(mocks.getPackageById).not.toHaveBeenCalled();
  });

  it('allows a booking against a business trip owner still inside their grace period', async () => {
    mocks.findProfileById.mockImplementation(async (id) => {
      if (id === 'sender-1') return verifiedSender();
      if (id === 'biz-1') return {
        id: 'biz-1', accountType: 'company', businessStatus: 'representative_kyc_required',
        businessGracePeriodStartedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      };
      return null;
    });
    mocks.getPackageById.mockResolvedValue(null); // next checkpoint after the guard

    const req = { body: reqBody, user: { id: 'sender-1' } };
    const res = mockRes();
    await RequestPackage(req, res);

    // Reached the package-ownership check (past the restriction guard)
    // instead of being blocked with BUSINESS_ACCOUNT_RESTRICTED.
    expect(mocks.getPackageById).toHaveBeenCalledWith('pkg-1');
    expect(res._code).toBe(404);
  });

  it('allows a booking against a fully verified business trip owner', async () => {
    mocks.findProfileById.mockImplementation(async (id) => {
      if (id === 'sender-1') return verifiedSender();
      if (id === 'biz-1') return {
        id: 'biz-1', accountType: 'company', businessStatus: 'verified',
        businessGracePeriodStartedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      };
      return null;
    });
    mocks.getPackageById.mockResolvedValue(null);

    const req = { body: reqBody, user: { id: 'sender-1' } };
    const res = mockRes();
    await RequestPackage(req, res);

    expect(mocks.getPackageById).toHaveBeenCalled();
    expect(res._code).toBe(404);
  });

  it('allows a booking against an individual (non-business) trip owner as before', async () => {
    mocks.findProfileById.mockImplementation(async (id) => {
      if (id === 'sender-1') return verifiedSender();
      if (id === 'traveler-2') return { id: 'traveler-2', accountType: 'individual' };
      return null;
    });
    mocks.getPackageById.mockResolvedValue(null);

    const req = { body: { ...reqBody, travelerId: 'traveler-2' }, user: { id: 'sender-1' } };
    const res = mockRes();
    await RequestPackage(req, res);

    expect(mocks.getPackageById).toHaveBeenCalled();
    expect(res._code).toBe(404);
  });

  it('returns 404 when the traveler does not exist', async () => {
    mocks.findProfileById.mockImplementation(async (id) => {
      if (id === 'sender-1') return verifiedSender();
      return null;
    });

    const req = { body: reqBody, user: { id: 'sender-1' } };
    const res = mockRes();
    await RequestPackage(req, res);

    expect(res._code).toBe(404);
    expect(mocks.getPackageById).not.toHaveBeenCalled();
  });
});
