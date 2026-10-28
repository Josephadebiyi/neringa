// Account display and checkout currency must not be inferred from a bank's
// settlement currency. A EUR account can legitimately have an NGN payout bank.
export function getUserAccountCurrency(user, fallback = 'USD') {
    const values = [
        user?.preferredCurrency, user?.preferred_currency,
        user?.walletDisplayCurrency, user?.wallet_display_currency,
        user?.earningCurrency, user?.earning_currency,
        user?.currency, user?.walletCurrency, user?.wallet_currency,
        fallback,
    ];
    for (const value of values) {
        const currency = String(value ?? '').trim().toUpperCase();
        if (/^[A-Z]{3}$/.test(currency)) return currency;
    }
    return '';
}

export function getUserPayoutCurrency(user, fallback = 'USD') {
    const value = user?.payoutAccount?.currency
        || user?.payout_account?.currency
        || user?.payoutCurrency
        || user?.payout_currency
        || user?.earningCurrency
        || user?.preferredCurrency
        || user?.preferred_currency
        || user?.walletCurrency
        || user?.wallet_currency
        || user?.currency
        || fallback;
    return value ? String(value).trim().toUpperCase() : String(fallback || '').trim().toUpperCase();
}

export function getCachedWallet(user) {
    const id = user?._id || user?.id;
    if (!id) return null;
    try {
        const cached = JSON.parse(sessionStorage.getItem(`bago_wallet_${id}`));
        const expectedCurrency = getUserAccountCurrency(user, '');
        return cached?.confirmed === true && cached?.currency === expectedCurrency ? cached : null;
    } catch {
        return null;
    }
}

export function cacheWallet(user, wallet) {
    const id = user?._id || user?.id;
    if (!id) return;
    sessionStorage.setItem(`bago_wallet_${id}`, JSON.stringify({ ...wallet, confirmed: true }));
}
