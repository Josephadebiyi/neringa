import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest';
import {verifyRecordedFlutterwavePayment} from '../services/flutterwaveVerificationRules.js';
const m = vi.hoisted(() => ({query: vi.fn(), queryOne: vi.fn(), approve: vi.fn(), get: vi.fn()}));
vi.mock('../lib/postgres/db.js', () => ({query: m.query, queryOne: m.queryOne}));
vi.mock('../lib/postgres/accounts.js', () => ({markKycApproved: m.approve}));
vi.mock('axios', () => ({default: {get: m.get}}));
vi.mock('../services/emailNotifications.js', () => ({sendKycApprovedEmail: vi.fn(), sendKycSubmittedEmail: vi.fn(), sendKycDeclinedEmail: vi.fn()}));
vi.mock('../services/pushNotificationService.js', () => ({sendPushNotification: vi.fn()}));
vi.mock('../services/securityService.js', () => ({runPreKycChecks: vi.fn()}));
import {syncPremblyResult} from '../controllers/PremblyController.js';
function res() {return {code: 200, status(code) {this.code = code; return this;}, json(value) {this.body = value; return this;}};}
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv('PREMBLY_API_KEY', 'test-only'); m.query.mockResolvedValue({rows: []});
});
afterEach(() => vi.unstubAllEnvs());
describe('KYC cannot be self-approved by a mobile callback', () => {
  it('ignores a forged approval and another user session reference', async () => {
    m.queryOne.mockImplementation(async sql => sql.includes('FROM public.profiles') ? {kycStatus: 'not_started', kycVerifiedData: {}} : null);
    const response = res();
    await syncPremblyResult({user: {id: 'user'}, body: {verificationRef: 'other-user-ref', sdkResponse: {status: 'approved', verification_ref: 'other-user-ref'}}}, response);
    expect(response.body.kycStatus).toBe('not_started'); expect(m.approve).not.toHaveBeenCalled(); expect(m.get).not.toHaveBeenCalled();
  });
  it('uses the server-owned reference and actual provider result instead of the submitted status', async () => {
    m.queryOne.mockImplementation(async sql => sql.includes('FROM public.profiles') ? {kycStatus: 'pending', kycVerifiedData: {verificationRef: 'owned-ref'}} : null);
    m.get.mockResolvedValue({data: {status: 'unknown'}});
    const response = res();
    await syncPremblyResult({user: {id: 'user'}, body: {sdkResponse: {status: 'approved', verification_ref: 'forged-ref'}}}, response);
    expect(response.body.kycStatus).toBe('pending'); expect(m.approve).not.toHaveBeenCalled();
    expect(m.get.mock.calls[0][1].params.verification_ref).toBe('owned-ref');
  });
  it('returns an already confirmed result without another provider call', async () => {
    m.queryOne.mockResolvedValue({kycStatus: 'approved'});
    const response = res(); await syncPremblyResult({user: {id: 'user'}, body: {}}, response);
    expect(response.body.kycStatus).toBe('approved'); expect(m.get).not.toHaveBeenCalled();
  });
});
describe('Flutterwave payment ownership and amount binding', () => {
  const payment = {user_id: 'sender', amount: 115, currency: 'EUR', raw_response: {packageId: 'package', tripId: 'trip'}};
  const verified = {amount: 115, currency: 'EUR'};
  it('accepts only the authenticated sender’s matching booking payment', () => {
    expect(verifyRecordedFlutterwavePayment(payment, verified, {senderId: 'sender', packageId: 'package', tripId: 'trip'})).toBe(true);
    expect(verifyRecordedFlutterwavePayment(payment, verified, {senderId: 'another-user'})).toBe(false);
    expect(verifyRecordedFlutterwavePayment(payment, verified, {senderId: 'sender', packageId: 'another-package'})).toBe(false);
    expect(verifyRecordedFlutterwavePayment(payment, {...verified, amount: 112.8}, {senderId: 'sender'})).toBe(false);
  });
});
