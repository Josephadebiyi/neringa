import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  query: vi.fn(), queryOne: vi.fn(), client: { query: vi.fn() },
  transfer: vi.fn(), orchestrated: vi.fn(), recipient: vi.fn(), sender: vi.fn(),
  save: vi.fn(), beneficiary: vi.fn(), submitted: vi.fn(), adminEmail: vi.fn(), admins: vi.fn(),
}));

vi.mock('../lib/postgres/db.js', () => ({
  query: m.query, queryOne: m.queryOne, withTransaction: async (fn) => fn(m.client),
}));
vi.mock('../services/flutterwaveService.js', () => ({
  isFlutterwaveConfigured: () => true,
  initializePayment: vi.fn(), verifyTransaction: vi.fn(), getBanks: vi.fn(), resolveAccount: vi.fn(),
  initiateTransfer: m.transfer, initiateOrchestratedTransfer: m.orchestrated,
  createTransferRecipient: m.recipient, createTransferSender: m.sender, verifyWebhookSignature: vi.fn(),
  getTransferStatus: vi.fn(),
}));
vi.mock('../lib/postgres/flutterwavePayments.js', () => ({
  recordPaymentInitiated: vi.fn(), markPaymentVerified: vi.fn(),
  saveBeneficiary: m.save, getActiveBeneficiary: m.beneficiary,
}));
vi.mock('../services/emailNotifications.js', () => ({
  generateOtpEmailHtml: vi.fn(), sendWithdrawalSubmittedEmail: m.submitted,
  sendWithdrawalAdminNotification: m.adminEmail, sendWithdrawalProcessedEmail: vi.fn(),
}));
vi.mock('../lib/postgres/trips.js', () => ({ listActiveAdminEmails: m.admins }));
vi.mock('../services/resendClient.js', () => ({ resend: null }));
vi.mock('../services/currencyConverter.js', () => ({
  CurrencyService: { normalizeCurrency: (value) => String(value || '').trim().toUpperCase() },
  FLUTTERWAVE_COLLECTION_CURRENCIES: new Set(), getFlutterwavePaymentCurrencyForCountry: vi.fn(),
  convertCurrency: vi.fn(async (value) => value),
}));

import { isValidBic, isValidIban } from '../services/manualPayout.js';
import { connectFlutterwaveBeneficiary, withdrawFundsFlutterwave } from '../controllers/FlutterwaveController.js';
import { approveWithdrawal } from '../controllers/AdminControllers/WithdrawalController.js';

const VALID_IBAN = 'ES91 2100 0418 4502 0005 1332';
function res() { return { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } }; }

const profile = {
  kyc_status: 'approved', email: 'traveller@example.com', first_name: 'Ana', last_name: 'García',
  account_type: 'individual', wallet_id: 'wallet-1', available_balance: 500, currency: 'EUR',
};
const ibanBeneficiary = {
  id: 'ben-1', currency: 'EUR', type: 'iban', provider: 'manual_bank_transfer',
  account_holder_name: 'Ana García', iban: 'ES9121000418450200051332', swift_code: 'CAIXESBBXXX', bank_name: 'CaixaBank',
};

beforeEach(() => {
  vi.clearAllMocks();
  m.query.mockResolvedValue({ rows: [] });
  m.queryOne.mockResolvedValue(profile);
  m.client.query.mockImplementation(async (sql) => ({ rows: sql.includes('UPDATE public.wallet_accounts') ? [{ available_balance: 400 }] : [] }));
  m.save.mockResolvedValue({ id: 'ben-1', masked_display: 'ES91 •••• 1332' });
  m.beneficiary.mockResolvedValue(ibanBeneficiary);
  m.admins.mockResolvedValue(['ops@example.com', 'finance@example.com']);
  m.submitted.mockResolvedValue(true);
  m.adminEmail.mockResolvedValue(true);
  m.transfer.mockResolvedValue({ success: true, status: 'NEW' });
});

describe('IBAN and BIC validation', () => {
  it('accepts real IBANs with or without spaces and rejects bad check digits', () => {
    expect(isValidIban(VALID_IBAN)).toBe(true);
    expect(isValidIban('DE89370400440532013000')).toBe(true);
    expect(isValidIban('ES9121000418450200051333')).toBe(false);
    expect(isValidIban('12345')).toBe(false);
  });
  it('accepts 8 and 11 character BICs only', () => {
    expect(isValidBic('CAIXESBB')).toBe(true);
    expect(isValidBic('caixesbbxxx')).toBe(true);
    expect(isValidBic('CAIX')).toBe(false);
  });
});

describe('linking a EUR payout account', () => {
  const body = { currency: 'EUR', accountHolderName: 'Ana García', iban: VALID_IBAN, swiftBic: 'caixesbbxxx', bankName: 'CaixaBank' };

  it('rejects an invalid IBAN before sending any code', async () => {
    const response = res();
    await connectFlutterwaveBeneficiary({ user: { id: 'u1' }, body: { ...body, iban: 'ES9121000418450200051333' } }, response, vi.fn());
    expect(response.code).toBe(400);
    expect(response.data.code).toBe('INVALID_IBAN');
  });

  it('stores the account for manual payout without registering it with Flutterwave', async () => {
    const response = res();
    await connectFlutterwaveBeneficiary({ user: { id: 'u1' }, body, payoutAccountOtpVerified: true }, response, vi.fn());
    expect(response.code).toBe(200);
    expect(m.recipient).not.toHaveBeenCalled();
    expect(m.sender).not.toHaveBeenCalled();
    expect(m.save).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'manual_bank_transfer', type: 'iban', iban: 'ES9121000418450200051332', swiftCode: 'CAIXESBBXXX',
    }));
  });
});

describe('withdrawing EUR', () => {
  it('debits the wallet and queues a request for admins instead of calling Flutterwave', async () => {
    const response = res();
    await withdrawFundsFlutterwave({ user: { id: 'u1', email: profile.email }, body: { amount: 100, currency: 'EUR' } }, response);
    expect(response.code).toBe(200);
    expect(response.data).toMatchObject({ success: true, manual: true, status: 'pending_admin_approval' });
    expect(m.transfer).not.toHaveBeenCalled();
    expect(m.orchestrated).not.toHaveBeenCalled();
    const insert = m.client.query.mock.calls.find(([sql]) => sql.includes('INSERT INTO public.wallet_transactions'));
    expect(insert[0]).toContain("'pending_admin_approval'");
    expect(insert[1][5]).toMatchObject({
      provider: 'manual_bank_transfer',
      payoutAccount: { iban: 'ES9121000418450200051332', swiftBic: 'CAIXESBBXXX', accountHolderName: 'Ana García' },
    });
    expect(m.adminEmail).toHaveBeenCalledTimes(2);
    expect(m.submitted).toHaveBeenCalled();
  });

  it('refuses when the wallet cannot cover the amount', async () => {
    m.client.query.mockResolvedValue({ rows: [] });
    const response = res();
    await withdrawFundsFlutterwave({ user: { id: 'u1' }, body: { amount: 100, currency: 'EUR' } }, response);
    expect(response.code).toBe(400);
    expect(m.adminEmail).not.toHaveBeenCalled();
  });

  it('asks for an IBAN when the EUR account on file has none', async () => {
    m.beneficiary.mockResolvedValue({ ...ibanBeneficiary, type: 'bank', iban: null });
    const response = res();
    await withdrawFundsFlutterwave({ user: { id: 'u1' }, body: { amount: 100, currency: 'EUR' } }, response);
    expect(response.data.code).toBe('IBAN_REQUIRED');
  });
});

describe('withdrawing a Flutterwave currency', () => {
  it('still pays out through Flutterwave as before', async () => {
    m.queryOne.mockImplementation(async (sql) => (sql.includes('UPDATE public.wallet_accounts')
      ? { available_balance: 0 } : { ...profile, currency: 'NGN', available_balance: 90000 }));
    m.beneficiary.mockResolvedValue({ id: 'ben-2', currency: 'NGN', type: 'bank', bank_code: '058', account_number: '0123456789', account_holder_name: 'Ana' });
    const response = res();
    await withdrawFundsFlutterwave({ user: { id: 'u1' }, body: { amount: 50000, currency: 'NGN' } }, response);
    expect(response.code).toBe(200);
    expect(m.transfer).toHaveBeenCalledWith(expect.objectContaining({ accountBank: '058', amount: 50000, currency: 'NGN' }));
    expect(m.adminEmail).not.toHaveBeenCalled();
  });
});

describe('admin approval of a manual payout', () => {
  it('moves it to processing without sending anything through Flutterwave', async () => {
    m.query.mockImplementation(async (sql) => (sql.includes('SELECT wt.*')
      ? { rows: [{ id: 'tx-1', user_id: 'u1', amount: 100, currency: 'EUR', metadata: { provider: 'manual_bank_transfer', reference: 'BAGO-WD-1' } }] }
      : { rows: [] }));
    const response = { status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await approveWithdrawal({ params: { transactionId: 'tx-1' }, admin: { id: 'admin-1' } }, response, vi.fn());
    expect(response.data).toMatchObject({ success: true, manual: true });
    expect(m.transfer).not.toHaveBeenCalled();
    expect(m.beneficiary).not.toHaveBeenCalled();
    const update = m.query.mock.calls.find(([sql]) => sql.includes("SET status = 'processing'"));
    expect(update).toBeTruthy();
  });
});
