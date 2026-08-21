import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryOne: vi.fn(),
  query: vi.fn().mockResolvedValue({ rows: [] }),
  getActiveBeneficiary: vi.fn(),
  convertCurrency: vi.fn(),
  assertNoActiveWithdrawal: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../services/flutterwaveService.js', () => ({
  isFlutterwaveConfigured: () => true,
  initializePayment: vi.fn(), verifyTransaction: vi.fn(), getBanks: vi.fn(), resolveAccount: vi.fn(),
  initiateTransfer: vi.fn(), initiateOrchestratedTransfer: vi.fn(), createTransferRecipient: vi.fn(),
  createTransferSender: vi.fn(), verifyWebhookSignature: vi.fn(),
}));

vi.mock('../lib/postgres/db.js', () => ({
  query: mocks.query,
  queryOne: mocks.queryOne,
}));

vi.mock('../lib/postgres/flutterwavePayments.js', () => ({
  recordPaymentInitiated: vi.fn(), markPaymentVerified: vi.fn(), saveBeneficiary: vi.fn(),
  getActiveBeneficiary: mocks.getActiveBeneficiary,
}));

vi.mock('../services/currencyConverter.js', () => ({
  CurrencyService: { normalizeCurrency: (c) => String(c || 'USD').toUpperCase() },
  FLUTTERWAVE_COLLECTION_CURRENCIES: [],
  getFlutterwavePaymentCurrencyForCountry: vi.fn(),
  convertCurrency: mocks.convertCurrency,
}));

vi.mock('../services/emailNotifications.js', () => ({
  generateOtpEmailHtml: vi.fn(), sendWithdrawalSubmittedEmail: vi.fn(),
}));

vi.mock('../services/resendClient.js', () => ({ resend: null }));
vi.mock('../services/withdrawalSafety.js', () => ({ assertNoActiveWithdrawal: mocks.assertNoActiveWithdrawal }));
vi.mock('../controllers/CurrencyController.js', () => ({ buildShipmentCheckoutPreview: vi.fn() }));

import { withdrawFundsFlutterwave } from '../controllers/FlutterwaveController.js';

function mockRes() {
  const res = { _code: null, _body: null };
  res.status = (code) => { res._code = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

function baseProfile(overrides = {}) {
  return {
    kyc_status: null, email: 'ops@acme.test', first_name: 'Ada', last_name: 'Cole',
    account_type: 'company', signup_method: 'email', business_status: 'representative_kyc_required',
    business_grace_period_started_at: null,
    wallet_id: 'wallet-1', available_balance: 10_000_000, currency: 'NGN',
    ...overrides,
  };
}

describe('withdrawFundsFlutterwave — business grace period / restriction gating', () => {
  beforeEach(() => {
    mocks.queryOne.mockReset();
    mocks.query.mockReset().mockResolvedValue({ rows: [] });
    mocks.getActiveBeneficiary.mockReset();
    mocks.convertCurrency.mockReset();
    mocks.assertNoActiveWithdrawal.mockReset().mockResolvedValue(undefined);
  });

  it('blocks a below-threshold withdrawal during the grace period, even without KYC', async () => {
    mocks.queryOne.mockResolvedValue(baseProfile({
      business_grace_period_started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 1h ago
    }));
    mocks.convertCurrency.mockResolvedValue(500_000); // below the ₦1,000,000 floor

    const req = { user: { id: 'biz-1' }, body: { amount: 500_000, currency: 'NGN' } };
    const res = mockRes();
    await withdrawFundsFlutterwave(req, res);

    expect(res._code).toBe(400);
    expect(res._body.code).toBe('BELOW_GRACE_PERIOD_MIN_PAYOUT');
    expect(mocks.getActiveBeneficiary).not.toHaveBeenCalled();
  });

  it('allows an at-or-above-threshold withdrawal during the grace period, bypassing the KYC gate', async () => {
    mocks.queryOne.mockResolvedValue(baseProfile({
      business_grace_period_started_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    }));
    mocks.convertCurrency.mockResolvedValue(1_000_000); // exactly the floor
    mocks.getActiveBeneficiary.mockResolvedValue(null); // next checkpoint after the gate

    const req = { user: { id: 'biz-1' }, body: { amount: 1_000_000, currency: 'NGN' } };
    const res = mockRes();
    await withdrawFundsFlutterwave(req, res);

    // Reached the beneficiary check (past the restriction gate) instead of
    // being blocked for BELOW_GRACE_PERIOD_MIN_PAYOUT / KYC_REQUIRED.
    expect(mocks.getActiveBeneficiary).toHaveBeenCalledWith('biz-1');
    expect(res._code).toBe(400);
    expect(res._body.message).toMatch(/no payout account linked/i);
  });

  it('blocks all withdrawals once the grace period has expired without admin approval', async () => {
    mocks.queryOne.mockResolvedValue(baseProfile({
      business_grace_period_started_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20d ago
    }));

    const req = { user: { id: 'biz-1' }, body: { amount: 5_000_000, currency: 'NGN' } };
    const res = mockRes();
    await withdrawFundsFlutterwave(req, res);

    expect(res._code).toBe(403);
    expect(res._body.code).toBe('BUSINESS_ACCOUNT_RESTRICTED');
    expect(mocks.getActiveBeneficiary).not.toHaveBeenCalled();
    expect(mocks.convertCurrency).not.toHaveBeenCalled();
  });

  it('still requires KYC for a company account with no grace period started (e.g. not logged in yet)', async () => {
    mocks.queryOne.mockResolvedValue(baseProfile({ business_grace_period_started_at: null }));

    const req = { user: { id: 'biz-1' }, body: { amount: 1_000, currency: 'NGN' } };
    const res = mockRes();
    await withdrawFundsFlutterwave(req, res);

    expect(res._code).toBe(403);
    expect(res._body.code).toBe('KYC_REQUIRED');
  });

  it('applies the normal KYC gate (unaffected) once a business is admin-approved', async () => {
    mocks.queryOne.mockResolvedValue(baseProfile({
      business_status: 'verified',
      business_grace_period_started_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
      kyc_status: 'approved',
    }));
    mocks.getActiveBeneficiary.mockResolvedValue(null);

    const req = { user: { id: 'biz-1' }, body: { amount: 1_000, currency: 'NGN' } };
    const res = mockRes();
    await withdrawFundsFlutterwave(req, res);

    expect(mocks.getActiveBeneficiary).toHaveBeenCalled();
    expect(res._body.message).toMatch(/no payout account linked/i);
  });

  it('individual (non-business) accounts are unaffected by grace-period logic and still need KYC', async () => {
    mocks.queryOne.mockResolvedValue(baseProfile({ account_type: 'individual', business_status: null }));

    const req = { user: { id: 'user-1' }, body: { amount: 1_000, currency: 'NGN' } };
    const res = mockRes();
    await withdrawFundsFlutterwave(req, res);

    expect(res._code).toBe(403);
    expect(res._body.code).toBe('KYC_REQUIRED');
  });
});
