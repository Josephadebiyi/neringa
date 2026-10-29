export const CHECKOUT_STASH_KEY = 'bago_flutterwave_checkout';

// Keep in sync with StripeCheckoutService.flutterwaveOnlyCurrencies in the app.
export const FLUTTERWAVE_ONLY_CURRENCIES = new Set([
    'NGN', 'GHS', 'KES', 'ZAR', 'UGX', 'TZS', 'RWF', 'XOF', 'XAF', 'ZMW',
    'MWK', 'EGP', 'SLL', 'ETB', 'MAD',
]);

export function paymentProviderForCurrency(currency) {
    const normalized = String(currency || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) throw new Error('A valid payment currency is required.');
    return FLUTTERWAVE_ONLY_CURRENCIES.has(normalized) ? 'flutterwave' : 'stripe';
}

export async function preparePaymentCheckout(checkout, api, storage = sessionStorage, isCurrent = () => true) {
    if (!Number.isFinite(Number(checkout.amount)) || Number(checkout.amount) <= 0) throw new Error('A valid checkout amount is required.');
    const savePending = pending => {
        if (!isCurrent()) throw new Error('Checkout changed. Please try again.');
        storage.setItem(CHECKOUT_STASH_KEY, JSON.stringify(pending));
    };
    const isAddKgMode = Boolean(checkout.requestId && checkout.additionalKg > 0);
    let paymentCheckout = { ...checkout, isAddKgMode };
    if (isAddKgMode) {
        const result = await api.post('/api/checkout/additional-weight-preview', {
            requestId: checkout.requestId, additionalKg: checkout.additionalKg,
        });
        const preview = result.data?.preview;
        if (!result.data?.success || !preview) throw new Error('Additional weight pricing could not be verified.');
        paymentCheckout = { ...paymentCheckout, packageId: preview.packageId, tripId: preview.tripId,
            travelerId: preview.travelerId, amount: preview.totalAmount, currency: preview.senderCurrency,
            weightQuote: preview };
    }
    const provider = paymentProviderForCurrency(paymentCheckout.currency);
    if (provider === 'stripe') {
        let config;
        try { config = (await api.get('/api/config/stripe')).data; } catch { /* show the same unavailable state as the app */ }
        if (config?.enabled !== true || !/^pk_(live|test)_/.test(config.publishableKey || '')) {
            throw new Error('International card payments are temporarily unavailable. Please try again later.');
        }
        const response = await api.post('/api/payments/create-intent', {
            amount: paymentCheckout.amount, currency: paymentCheckout.currency,
            packageId: paymentCheckout.packageId, tripId: paymentCheckout.tripId,
            travelerId: paymentCheckout.travelerId, termsAccepted: true,
            insurance: paymentCheckout.insurance === true, paymentMethodType: 'card', checkoutClient: 'web',
            ...(isAddKgMode && { requestId: checkout.requestId, additionalKg: checkout.additionalKg }),
        });
        const intent = response.data;
        if (intent?.success !== true || !intent.clientSecret || !/^pi_[A-Za-z0-9]+$/.test(intent.paymentIntentId || '')) {
            throw new Error(intent?.message || 'Card checkout could not start.');
        }
        const pending = { ...paymentCheckout, provider, reference: intent.paymentIntentId };
        // Persist the booking before opening payment UI. Never store card data or client secrets.
        savePending(pending);
        return { ...pending, publishableKey: config.publishableKey, clientSecret: intent.clientSecret,
            paymentStatus: intent.paymentStatus };
    }
    const body = isAddKgMode ? {
        requestId: checkout.requestId, additionalKg: checkout.additionalKg,
        amount: paymentCheckout.amount, currency: paymentCheckout.currency,
    } : {
        packageId: checkout.packageId, tripId: checkout.tripId,
        amount: checkout.amount, currency: checkout.currency,
        metadata: { insurance: checkout.insurance, insuranceCost: checkout.insuranceCost },
    };
    const response = await api.post('/api/payments/flutterwave/initialize', body);
    const data = response.data?.data || response.data;
    if (!data?.authorizationUrl || !data?.reference) throw new Error(response.data?.message || 'Local checkout could not start.');
    if (new URL(data.authorizationUrl).protocol !== 'https:') throw new Error('A secure payment link could not be created.');
    const pending = { ...paymentCheckout, provider, reference: data.reference };
    savePending(pending);
    return { ...pending, authorizationUrl: data.authorizationUrl };
}

export async function completePaymentCheckout(provider, reference, api, storage = sessionStorage) {
    const raw = storage.getItem(CHECKOUT_STASH_KEY);
    if (!raw) throw new Error('Payment session could not be found. Check your shipments or contact support before paying again.');
    const pending = JSON.parse(raw);
    if ((pending.provider || 'flutterwave') !== provider) throw new Error('Payment provider does not match this checkout.');
    if (provider === 'stripe') {
        if (!/^pi_[A-Za-z0-9]+$/.test(reference || '') || reference !== pending.reference) {
            throw new Error('Payment reference does not match this checkout.');
        }
    } else if (provider === 'flutterwave') {
        if (!/^\d+$/.test(reference || '')) throw new Error('Invalid payment reference.');
        const verified = (await api.get(`/api/payments/flutterwave/verify/${reference}`)).data;
        if (!verified?.success || verified.reference !== pending.reference ||
            String(verified.currency).toUpperCase() !== pending.currency.toUpperCase() ||
            Math.abs(Number(verified.amount) - Number(pending.amount)) > 0.011) {
            const error = new Error('Payment is still awaiting verification. Check your shipments before paying again.');
            // A successful response with a different reference/amount is a
            // permanent mismatch, not a reason to retry another booking.
            error.retryable = verified?.success !== true;
            throw error;
        }
    } else throw new Error('Unsupported payment provider.');

    // The server independently verifies ownership, amount, currency and provider
    // before creating a booking. A return URL alone never counts as payment.
    const response = await api.post('/api/bago/RequestPackage', {
        packageId: pending.packageId, tripId: pending.tripId, travelerId: pending.travelerId,
        amount: pending.amount, currency: pending.currency, termsAccepted: true,
        estimatedDeparture: pending.estimatedDeparture, insurance: pending.insurance,
        insuranceCost: pending.insuranceCost || 0, paymentReference: reference, paymentProvider: provider,
        ...(pending.isAddKgMode && { requestId: pending.requestId, additionalKg: pending.additionalKg }),
    });
    if (response.data?.success !== true || response.data?.paymentPending === true) {
        const error = new Error('Payment is still confirming. Check your shipments before paying again.');
        error.retryable = response.data?.paymentPending === true;
        throw error;
    }
    const current = JSON.parse(storage.getItem(CHECKOUT_STASH_KEY) || 'null');
    if (current?.reference === pending.reference && (current.provider || 'flutterwave') === provider) {
        storage.removeItem(CHECKOUT_STASH_KEY);
    }
    return { pending, request: response.data.request || response.data.data || response.data };
}

export function canRetryPaymentConfirmation(error) {
    if (typeof error?.retryable === 'boolean') return error.retryable;
    const status = error?.response?.status;
    return ['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error?.code)
        || [402, 408, 425, 429, 500, 502, 503, 504].includes(status);
}

export async function confirmPaymentWithRetry(provider, reference, api, {
    storage = sessionStorage,
    isActive = () => true,
    wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)),
    onRetry = () => {},
} = {}) {
    const delays = [1500, 3000, 6000];
    for (let attempt = 0; ; attempt++) {
        if (!isActive()) return null;
        try {
            return await completePaymentCheckout(provider, reference, api, storage);
        } catch (error) {
            if (!isActive()) return null;
            if (!canRetryPaymentConfirmation(error) || attempt >= delays.length) throw error;
            onRetry(attempt + 1);
            await wait(delays[attempt]);
        }
    }
}
