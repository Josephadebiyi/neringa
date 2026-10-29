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

import {applyPaidAdditionalKg} from '../controllers/postgresRequestController.js';
import {query, queryOne, withTransaction} from '../lib/postgres/db.js';
import {getShipmentRequestById} from '../lib/postgres/shipping.js';
import {buildTripCapacitySnapshot} from '../lib/postgres/tripCapacity.js';
import {convertCurrency} from '../services/currencyConverter.js';
let state;
const quote = {totalAmount: 34.5, travelerPayout: 30, travelerCurrency: 'USD', platformFee: 4.5, processingFee: 0, fxBuffer: 0, shippingAmount: 34.5, bagoNetRevenue: 4.5};
const args = {requestId: 'request', senderId: 'sender', additionalKg: 3, additionalAmount: 34.5, currency: 'USD', paymentReference: 'pi_extra', paymentProvider: 'stripe', quote};
beforeEach(() => {
  vi.clearAllMocks();
  state = {id: 'request', sender_id: 'sender', traveler_id: 'traveler', trip_id: 'trip', package_id: 'pkg', status: 'accepted_awaiting_inspection', amount: 23, currency: 'USD', payment_info: {requestId: 'pi_original'}};
  withTransaction.mockImplementation(work => work({query}));
  query.mockImplementation(async (sql, params) => {
    if (sql.includes('select id, traveler_id')) return {rows: [state]};
    if (sql.includes('insert into public.payment_events')) return {rows: [{id: 'event'}], rowCount: 1};
    if (sql.includes('select id, currency from public.wallet_accounts')) return {rows: [{id: 'wallet', currency: 'USD'}]};
    if (sql.includes('set amount = $2')) state.payment_info = params[3];
    return {rows: []};
  });
  getShipmentRequestById.mockResolvedValue({id: 'request'});
  buildTripCapacitySnapshot.mockResolvedValue({availableKg: 10});
});
it('adds accepted shipment weight and credits only the trip-rate payout, excluding fees', async () => {
  await applyPaidAdditionalKg(args);
  const credit = query.mock.calls.find(([sql]) => sql.includes('set escrow_balance = escrow_balance +'));
  expect(credit[1]).toEqual(['traveler', 30]);
  expect(convertCurrency).not.toHaveBeenCalled();
  const update = query.mock.calls.find(([sql]) => sql.includes('set amount = $2'));
  expect(update[1].slice(0, 3)).toEqual(['request', 57.5, 'USD']);
  expect(update[1][4]).toBe(30);
});
it('does not add the weight or credit earnings twice on a payment retry', async () => {
  await applyPaidAdditionalKg(args);
  await applyPaidAdditionalKg(args);
  expect(query.mock.calls.filter(([sql]) => sql.includes('update public.packages'))).toHaveLength(1);
  expect(query.mock.calls.filter(([sql]) => sql.includes('set escrow_balance = escrow_balance +'))).toHaveLength(1);
});
it('blocks a payment already used by another shipment before weight changes', async () => {
  const original = query.getMockImplementation();
  query.mockImplementation((sql, params) => sql.includes('insert into public.payment_events') ? {rows: [], rowCount: 0} : original(sql, params));
  await expect(applyPaidAdditionalKg(args)).rejects.toThrow('already been used');
  expect(query.mock.calls.some(([sql]) => sql.includes('update public.packages'))).toBe(false);
});
