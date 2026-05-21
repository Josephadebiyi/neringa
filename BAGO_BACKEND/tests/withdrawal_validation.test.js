import { describe, it, expect } from 'vitest';

// Mirror of the validation logic from userController.js withdrawFunds
const MINIMUM_WITHDRAWAL_USD = 5;
const DAILY_WITHDRAWAL_LIMIT_USD = 2000;
const PAYSTACK_PAYOUT_CURRENCIES = ['NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'RWF'];

function payoutMethodForCurrency(currency = 'USD') {
  return PAYSTACK_PAYOUT_CURRENCIES.includes(currency.toUpperCase()) ? 'bank' : 'stripe';
}

function validateWithdrawal({ amount, walletCurrency, availableBalance, stripeVerified, stripeAccountId, paystackRecipientCode, spentTodayUsd, amountUsd }) {
  if (!amount || Number(amount) <= 0) return { ok: false, reason: 'Positive amount required' };

  const method = payoutMethodForCurrency(walletCurrency);

  if (method === 'stripe' && (!stripeAccountId || !stripeVerified))
    return { ok: false, reason: 'Connect and verify Stripe before withdrawing.' };

  if (method === 'bank' && !paystackRecipientCode)
    return { ok: false, reason: 'Add and verify a bank account before withdrawing.' };

  if (Number(availableBalance) < Number(amount))
    return { ok: false, reason: 'Insufficient balance' };

  if (spentTodayUsd + amountUsd > DAILY_WITHDRAWAL_LIMIT_USD)
    return { ok: false, reason: 'Daily withdrawal limit reached.' };

  return { ok: true };
}

describe('withdrawal validation', () => {
  const baseStripeUser = {
    walletCurrency: 'USD',
    availableBalance: 100,
    stripeVerified: true,
    stripeAccountId: 'acct_test',
    paystackRecipientCode: null,
    spentTodayUsd: 0,
    amountUsd: 20,
  };

  const baseNgnUser = {
    walletCurrency: 'NGN',
    availableBalance: 50000,
    stripeVerified: false,
    stripeAccountId: null,
    paystackRecipientCode: 'RCP_abc123',
    spentTodayUsd: 0,
    amountUsd: 10,
  };

  it('allows valid USD/Stripe withdrawal', () => {
    expect(validateWithdrawal({ ...baseStripeUser, amount: 20 }).ok).toBe(true);
  });

  it('allows valid NGN/Paystack withdrawal', () => {
    expect(validateWithdrawal({ ...baseNgnUser, amount: 5000 }).ok).toBe(true);
  });

  it('rejects zero amount', () => {
    const r = validateWithdrawal({ ...baseStripeUser, amount: 0 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/positive/i);
  });

  it('rejects negative amount', () => {
    expect(validateWithdrawal({ ...baseStripeUser, amount: -10 }).ok).toBe(false);
  });

  it('rejects USD withdrawal when Stripe not connected', () => {
    const r = validateWithdrawal({ ...baseStripeUser, stripeVerified: false, stripeAccountId: null, amount: 20 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/stripe/i);
  });

  it('rejects USD withdrawal when Stripe connected but not verified', () => {
    const r = validateWithdrawal({ ...baseStripeUser, stripeVerified: false, amount: 20 });
    expect(r.ok).toBe(false);
  });

  it('rejects NGN withdrawal when no bank account linked', () => {
    const r = validateWithdrawal({ ...baseNgnUser, paystackRecipientCode: null, amount: 5000 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/bank/i);
  });

  it('rejects when amount exceeds available balance', () => {
    const r = validateWithdrawal({ ...baseStripeUser, amount: 200 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/insufficient/i);
  });

  it('rejects when daily limit would be exceeded', () => {
    const r = validateWithdrawal({ ...baseStripeUser, amount: 20, amountUsd: 20, spentTodayUsd: 1990 });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/daily/i);
  });

  it('allows withdrawal exactly at daily limit', () => {
    const r = validateWithdrawal({ ...baseStripeUser, amount: 10, amountUsd: 10, spentTodayUsd: 1990 });
    expect(r.ok).toBe(true);
  });

  it('routes GHS to bank (Paystack)', () => {
    expect(payoutMethodForCurrency('GHS')).toBe('bank');
  });

  it('routes EUR to stripe', () => {
    expect(payoutMethodForCurrency('EUR')).toBe('stripe');
  });

  it('routes GBP to stripe', () => {
    expect(payoutMethodForCurrency('GBP')).toBe('stripe');
  });
});
