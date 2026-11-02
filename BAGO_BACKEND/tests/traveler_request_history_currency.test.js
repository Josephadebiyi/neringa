import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findProfileById: vi.fn(),
  checkTermsAccepted: vi.fn(),
  getPackageById: vi.fn(),
  earning: vi.fn(),
  listRequestsForUser: vi.fn(),
  listRecentOrdersForUser: vi.fn(),
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
  listRecentOrdersForUser: mocks.listRecentOrdersForUser, listIncomingRequestsForTraveler: vi.fn(), listRequestsForTrip: vi.fn(),
  listRequestsForUser: mocks.listRequestsForUser, markAllNotificationsRead: vi.fn(), markNotificationRead: vi.fn(),
  raiseShipmentDispute: vi.fn(), updateDisputeStatus: vi.fn(), updatePaymentInfo: vi.fn(),
  updateRequestImage: vi.fn(), updateShipmentDates: vi.fn(), updateShipmentRequestStatus: vi.fn(),
  updateTravelerProof: vi.fn(), savePackageInspection: vi.fn(),
}));
vi.mock('../lib/postgres/accounts.js', () => ({ holdEscrowForPaidRequest: vi.fn(), getTravelerEarningForRequest: mocks.earning }));
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

import { getRequests, recentOrder } from '../controllers/postgresRequestController.js';

// Lagos -> Barcelona: the sender paid EUR 68.79; the traveler's wallet is NGN.
const booking = {
  id: 'req-1', senderId: 'sender-1', travelerId: 'traveler-1', status: 'completed',
  amount: 68.79, currency: 'EUR', travelerPayout: 58.47, insuranceCost: 0,
};
function res() { return { code: 200, status(c) { this.code = c; return this; }, json(d) { this.data = d; return this; } }; }

beforeEach(() => {
  vi.clearAllMocks();
  mocks.earning.mockResolvedValue({ amount: 93552, currency: 'NGN' });
  mocks.listRequestsForUser.mockResolvedValue([booking]);
  mocks.listRecentOrdersForUser.mockResolvedValue([{ ...booking, role: 'traveler' }]);
});

describe('request history seen by the traveler', () => {
  it('labels the row as theirs so apps show the NGN earning, not the EUR payment', async () => {
    const response = res();
    await getRequests({ user: { id: 'traveler-1' }, params: {} }, response);
    const [row] = response.data.requests;
    expect(row).toMatchObject({
      role: 'traveler', travelerPayout: 93552, currency: 'NGN', paymentAmount: 68.79, paymentCurrency: 'EUR',
    });
  });

  it('leaves the sender\'s own view in what they paid', async () => {
    const response = res();
    await getRequests({ user: { id: 'sender-1' }, params: {} }, response);
    const [row] = response.data.requests;
    expect(row).toMatchObject({ role: 'sender', amount: 68.79, currency: 'EUR' });
    expect(mocks.earning).not.toHaveBeenCalled();
  });

  it('converts traveler rows in recent orders too', async () => {
    const response = res();
    await recentOrder({ user: { id: 'traveler-1' } }, response);
    expect(response.data.data[0]).toMatchObject({ role: 'traveler', travelerPayout: 93552, currency: 'NGN', paymentCurrency: 'EUR' });
  });
});
