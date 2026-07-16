import api from '../api';

let ratesPromise;

async function getRates() {
    ratesPromise ||= api.get('/api/bago/get-settings').then((response) => {
        const data = response.data?.data || response.data || {};
        const rates = data.exchangeRates || data.exchange_rates;
        if (!rates || typeof rates !== 'object') throw new Error('Exchange rates unavailable');
        return { USD: 1, ...rates };
    }).catch((error) => {
        ratesPromise = null;
        throw error;
    });
    return ratesPromise;
}

export async function convertCurrencyAmount(amount, fromCurrency, toCurrency) {
    const numeric = Number(amount);
    const from = String(fromCurrency || '').toUpperCase();
    const to = String(toCurrency || '').toUpperCase();
    if (!Number.isFinite(numeric)) return 0;
    if (!from || !to || from === to) return numeric;

    const rates = await getRates();
    const fromRate = Number(rates[from]);
    const toRate = Number(rates[to]);
    if (!(fromRate > 0) || !(toRate > 0)) throw new Error(`Missing ${from}/${to} exchange rate`);
    return (numeric / fromRate) * toRate;
}

export async function convertWallet(wallet, targetCurrency) {
    const sourceCurrency = String(wallet.currency || targetCurrency || 'USD').toUpperCase();
    const target = String(targetCurrency || sourceCurrency).toUpperCase();
    if (sourceCurrency === target) return { ...wallet, currency: target };

    const [balance, escrow, allTimeReceived, allTimeExpenses] = await Promise.all([
        convertCurrencyAmount(wallet.balance, sourceCurrency, target),
        convertCurrencyAmount(wallet.escrow, sourceCurrency, target),
        convertCurrencyAmount(wallet.allTimeReceived, sourceCurrency, target),
        convertCurrencyAmount(wallet.allTimeExpenses, sourceCurrency, target),
    ]);
    const history = await Promise.all((wallet.history || []).map(async (transaction) => ({
        ...transaction,
        amount: await convertCurrencyAmount(
            transaction.amount,
            transaction.currency || sourceCurrency,
            target,
        ),
        currency: target,
    })));

    return { ...wallet, balance, escrow, history, allTimeReceived, allTimeExpenses, currency: target };
}
