import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryOne: vi.fn(),
  query: vi.fn().mockResolvedValue({ rows: [] }),
  getActiveBeneficiary: vi.fn(),
  initiateTransfer: vi.fn(),
  initiateOrchestratedTransfer: vi.fn(),
  sendWithdrawalAdminNotification: vi.fn().mockResolvedValue(true),
  sendWithdrawalSubmittedEmail: vi.fn().mockResolvedValue(true),
  sendPushNotification: vi.fn().mockResolvedValue(true),
  listActiveAdminEmails: vi.fn().mockResolvedValue(['finance@bago.test']),
  isFlutterwaveConfigured: vi.fn(() => true),
}));

vi.mock('../services/flutterwaveService.js', () => ({
  isFlutterwaveConfigured: mocks.isFlutterwaveConfigured,
  initializePayment: vi.fn(), verifyTransaction: vi.fn(), getBanks: vi.fn(), resolveAccount: vi.fn(),
  initiateTransfer: mocks.initiateTransfer, initiateOrchestratedTransfer: mocks.initiateOrchestratedTransfer,
  createTransferRecipient: vi.fn(), createTransferSender: vi.fn(), verifyWebhookSignature: vi.fn(),
}));
vi.mock('../lib/postgres/db.js', () => ({ query: mocks.query, queryOne: mocks.queryOne }));
vi.mock('../lib/postgres/flutterwavePayments.js', () => ({
  recordPaymentInitiated: vi.fn(), markPaymentVerified: vi.fn(), saveBeneficiary: vi.fn(),
  getActiveBeneficiary: mocks.getActiveBeneficiary,
}));
vi.mock('../lib/postgres/trips.js', () => ({ listActiveAdminEmails: mocks.listActiveAdminEmails }));
vi.mock('../services/currencyConverter.js', () => ({
  CurrencyService: { normalizeCurrency: (c) => String(c || 'USD').toUpperCase() },
  FLUTTERWAVE_COLLECTION_CURRENCIES: [],
  getFlutterwavePaymentCurrencyForCountry: vi.fn(),
  convertCurrency: vi.fn(),
}));
vi.mock('../services/emailNotifications.js', () => ({
  generateOtpEmailHtml: vi.fn(),
  sendWithdrawalSubmittedEmail: mocks.sendWithdrawalSubmittedEmail,
  sendWithdrawalAdminNotification: mocks.sendWithdrawalAdminNotification,
}));
vi.mock('../services/pushNotificationService.js', () => ({ sendPushNotification: mocks.sendPushNotification }));
vi.mock('../services/resendClient.js', () => ({ resend: null }));
vi.mock('../services/withdrawalSafety.js', () => ({ assertNoActiveWithdrawal: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../controllers/CurrencyController.js', () => ({ buildShipmentCheckoutPreview: vi.fn() }));

import { withdrawFundsFlutterwave } from '../controllers/FlutterwaveController.js';

function mockRes() {
  const res = { _code: null, _body: null };
  res.status = (code) => { res._code = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
}

const profile = (currency) => ({
  kyc_status: 'approved', email: 'ada@bago.test', first_name: 'Ada', last_name: 'Cole',
  account_type: 'individual', signup_method: 'email', business_status: null,
  business_grace_period_started_at: null, is_demo_account: false,
  wallet_id: 'wallet-1', available_balance: 500, currency,
});

describe('withdrawFundsFlutterwave — manual USD/EUR payouts', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((fn) => fn.mockClear?.());
    mocks.query.mockResolvedValue({ rows: [] });
    mocks.isFlutterwaveConfigured.mockReturnValue(true);
  });

  it.each(['USD', 'EUR'])('queues a %s withdrawal for the accounts team instead of calling Flutterwave', async (currency) => {
    mocks.queryOne
      .mockResolvedValueOnce(profile(currency))
      .mockResolvedValueOnce({ available_balance: 400 }); // wallet debit
    mocks.getActiveBeneficiary.mockResolvedValue({
      currency, account_holder_name: 'Ada Cole', bank_name: 'Chase',
      account_number: '000123456789', bank_code: '021000021', iban: null, swift_code: null,
    });

    const res = mockRes();
    await withdrawFundsFlutterwave({ user: { id: 'u1', email: 'ada@bago.test' }, body: { amount: 100, currency } }, res);

    expect(res._code).toBe(200);
    expect(res._body).toMatchObject({ success: true, manual: true, status: 'pending_admin_approval' });
    expect(mocks.initiateTransfer).not.toHaveBeenCalled();
    expect(mocks.initiateOrchestratedTransfer).not.toHaveBeenCalled();

    const insert = mocks.query.mock.calls.find(([sql]) => /INSERT INTO public.wallet_transactions/.test(sql));
    expect(insert[0]).toMatch(/'pending_admin_approval'/);
    expect(insert[1][5]).toMatchObject({
      provider: 'manual_bank_transfer',
      manualReviewRequired: true,
      payoutAccount: { accountNumber: '000123456789', routingNumber: '021000021', currency },
    });
    expect(mocks.sendWithdrawalAdminNotification).toHaveBeenCalledWith('finance@bago.test', expect.objectContaining({ amount: 100, currency }));
    expect(mocks.sendWithdrawalSubmittedEmail).toHaveBeenCalled();
    expect(mocks.sendPushNotification).toHaveBeenCalledWith('u1', 'Withdrawal requested', expect.any(String), expect.any(Object));
  });

  it('still accepts manual withdrawals while Flutterwave is unconfigured', async () => {
    mocks.isFlutterwaveConfigured.mockReturnValue(false);
    mocks.queryOne.mockResolvedValueOnce(profile('USD')).mockResolvedValueOnce({ available_balance: 400 });
    mocks.getActiveBeneficiary.mockResolvedValue({ currency: 'USD', account_number: '1', bank_code: '021000021' });

    const res = mockRes();
    await withdrawFundsFlutterwave({ user: { id: 'u1' }, body: { amount: 100, currency: 'USD' } }, res);
    expect(res._code).toBe(200);
    expect(res._body.manual).toBe(true);
  });

  it('keeps NGN withdrawals on the automatic Flutterwave transfer', async () => {
    mocks.queryOne.mockResolvedValueOnce(profile('NGN')).mockResolvedValueOnce({ available_balance: 400 });
    mocks.getActiveBeneficiary.mockResolvedValue({ currency: 'NGN', account_number: '0123456789', bank_code: '058', type: 'bank' });
    mocks.initiateTransfer.mockResolvedValue({ success: true, status: 'NEW' });

    const res = mockRes();
    await withdrawFundsFlutterwave({ user: { id: 'u1' }, body: { amount: 100, currency: 'NGN' } }, res);
    expect(res._code).toBe(200);
    expect(res._body.manual).toBeUndefined();
    expect(mocks.initiateTransfer).toHaveBeenCalled();
    expect(mocks.sendWithdrawalAdminNotification).not.toHaveBeenCalled();
  });
});
