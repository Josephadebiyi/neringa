import { describe, it, expect } from 'vitest';

// Mirror of the validation logic from userController.js withdrawFunds
const MINIMUM_WITHDRAWAL_USD = 5;
const DAILY_WITHDRAWAL_LIMIT_USD = 2000;
const PAYSTACK_PAYOUT_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'RWF'];

function payoutMethodForCurrency(currency = 'USD') {
  return PAYSTACK_PAYOUT_CURRENCIES.includes(currency.toUpperCase()) ? 'bank' : 'paypal';
}

function validateWithdrawal({ amount, walletCurrency, availableBalance, paypalEmail, paystackRecipientCode, spentTodayUsd, amountUsd }) {
  if (!amount || Number(amount) <= 0) return { ok: false, reason: 'Positive amount required' };

  const method = payoutMethodForCurrency(walletCurrency);

  if (method === 'paypal' && !paypalEmail)
    return { ok: false, reason: 'Set up PayPal payouts before withdrawing.' };

  if (method === 'bank' && !paystackRecipientCode)
    return { ok: false, reason: 'Add and verify a bank account before withdrawing.' };

  if (Number(availableBalance) < Number(amount))
    return { ok: false, reason: 'Insufficient balance' };

  if (spentTodayUsd + amountUsd > DAILY_WITHDRAWAL_LIMIT_USD)
    return { ok: false, reason: 'Daily withdrawal limit reached.' };

  return { ok: true };
}

describe('withdrawal validation', () => {
  const basePaypalUser = {
    walletCurrency: 'USD',
    availableBalance: 100,
    paypalEmail: 'traveler@example.com',
    paystackRecipientCode: null,
    spentTodayUsd: 0,
    amountUsd: 20,
  };

  const baseNgnUser = {
    walletCurrency: 'NGN',
    availableBalance: 50000,
    paypalEmail: null,
    paystackRecipientCode: 'RCP_abc123',
    spentTodayUsd: 0,
    amountUsd: 10,
  };

  it('allows valid USD/PayPal withdrawal', () => {
    expect(validateWithdrawal({ ...basePaypalUser, amount: 20 }).ok).toBe(true);
  });

  it('allows valid NGN/Paystack withdrawal', () => {
    expect(validateWithdrawal({ ...baseNgnUser, amount: 5000 }).ok).toBe(true);
  });

  it('rejects zero amount', () => {
    const r = validateWithdrawal({ ...basePaypalUser, amount: 0 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/positive/i);
  });

  it('rejects negative amount', () => {
    expect(validateWithdrawal({ ...basePaypalUser, amount: -10 }).ok).toBe(false);
  });

  it('rejects USD withdrawal when PayPal is not connected', () => {
    const r = validateWithdrawal({ ...basePaypalUser, paypalEmail: null, amount: 20 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/paypal/i);
  });

  it('rejects NGN withdrawal when no bank account linked', () => {
    const r = validateWithdrawal({ ...baseNgnUser, paystackRecipientCode: null, amount: 5000 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/bank/i);
  });

  it('rejects when amount exceeds available balance', () => {
    const r = validateWithdrawal({ ...basePaypalUser, amount: 200 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/insufficient/i);
  });

  it('rejects when daily limit would be exceeded', () => {
    const r = validateWithdrawal({ ...basePaypalUser, amount: 20, amountUsd: 20, spentTodayUsd: 1990 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/daily/i);
  });

  it('allows withdrawal exactly at daily limit', () => {
    const r = validateWithdrawal({ ...basePaypalUser, amount: 10, amountUsd: 10, spentTodayUsd: 1990 });
    expect(r.ok).toBe(true);
  });

  it('routes GHS to bank (Paystack)', () => {
    expect(payoutMethodForCurrency('GHS')).toBe('bank');
  });

  it('routes EUR to PayPal', () => {
    expect(payoutMethodForCurrency('EUR')).toBe('paypal');
  });

  it('routes GBP to PayPal', () => {
    expect(payoutMethodForCurrency('GBP')).toBe('paypal');
  });
});
