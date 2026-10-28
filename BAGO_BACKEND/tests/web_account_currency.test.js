import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheWallet, getCachedWallet, getUserAccountCurrency, getUserPayoutCurrency } from '../../BAGO_WEBAPP/src/utils/userCurrency.js';

const api = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock('../../BAGO_WEBAPP/src/api.js', () => ({ default: api }));
import { convertCurrencyAmount, convertWallet } from '../../BAGO_WEBAPP/src/utils/currencyConversion.js';

beforeEach(() => {
    const storage = new Map();
    vi.stubGlobal('sessionStorage', {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, value),
    });
    api.get.mockResolvedValue({ data: { exchangeRates: { USD: 1, EUR: 0.9, NGN: 1500 } } });
});

describe('EUR account with an NGN payout bank', () => {
    const user = { id: 'eur-user', preferredCurrency: 'EUR', earningCurrency: 'NGN', walletCurrency: 'NGN', payoutAccount: { currency: 'NGN' } };

    it('uses EUR for account display and checkout, retaining NGN for payouts', () => {
        expect(getUserAccountCurrency(user)).toBe('EUR');
        expect(getUserPayoutCurrency(user)).toBe('NGN');
    });

    it('handles snake-case fields, whitespace, and empty aliases', () => {
        expect(getUserAccountCurrency({ preferredCurrency: ' ', preferred_currency: ' eur ', payout_currency: 'NGN' })).toBe('EUR');
        expect(getUserAccountCurrency({ earning_currency: 'GBP', payout_currency: 'NGN' })).toBe('GBP');
        expect(getUserAccountCurrency({ payout_currency: 'NGN' }, 'EUR')).toBe('EUR');
    });

    it('discards stale naira display caches after resolving the euro account', () => {
        cacheWallet(user, { balance: 15000, currency: 'NGN' });
        expect(getCachedWallet(user)).toBeNull();
        cacheWallet(user, { balance: 9, currency: 'EUR' });
        expect(getCachedWallet(user).balance).toBe(9);
    });

    it('converts balances, escrow, totals and history instead of relabelling NGN', async () => {
        const result = await convertWallet({ currency: 'NGN', balance: 15000, escrow: 30000,
            allTimeReceived: 45000, allTimeExpenses: 1500,
            history: [{ amount: 15000, currency: 'NGN' }, { amount: 10, currency: 'USD' }],
        }, getUserAccountCurrency(user));
        expect(result).toMatchObject({ currency: 'EUR', balance: 9, escrow: 18, allTimeReceived: 27, allTimeExpenses: 0.9 });
        expect(result.history).toEqual([{ amount: 9, currency: 'EUR' }, { amount: 9, currency: 'EUR' }]);
    });

    it('converts a euro withdrawal back to the wallet currency before debit', async () => {
        expect(await convertCurrencyAmount(9, getUserAccountCurrency(user), user.walletCurrency)).toBe(15000);
    });

    it('converts foreign-currency history even when the wallet itself is already EUR', async () => {
        const result = await convertWallet({ currency: 'EUR', balance: 12,
            history: [{ amount: 15000, currency: 'NGN' }],
        }, 'EUR');
        expect(result.balance).toBe(12);
        expect(result.history).toEqual([{ amount: 9, currency: 'EUR' }]);
    });
});
