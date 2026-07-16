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
        const expectedCurrency = getUserPayoutCurrency(user, '');
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
