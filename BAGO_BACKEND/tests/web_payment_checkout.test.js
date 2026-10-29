import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHECKOUT_STASH_KEY, FLUTTERWAVE_ONLY_CURRENCIES, paymentProviderForCurrency, preparePaymentCheckout, completePaymentCheckout, confirmPaymentWithRetry } from '../../BAGO_WEBAPP/src/utils/paymentCheckout.js';
import { confirmStripeWebPayment } from '../../BAGO_WEBAPP/src/utils/stripeWeb.js';

let storage;
let api;
const checkout = { packageId: 'pkg', tripId: 'trip', travelerId: 'traveler', amount: 112.8,
    currency: 'EUR', insurance: true, insuranceCost: 5 };
beforeEach(() => {
    const data = new Map();
    storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
    api = {
        get: vi.fn().mockResolvedValue({ data: { enabled: true, publishableKey: 'pk_test_mock' } }),
        post: vi.fn().mockImplementation(async path => ({ data: path.includes('create-intent')
            ? { success: true, clientSecret: 'pi_mock_secret_mock', paymentIntentId: 'pi_mock', paymentStatus: 'requires_payment_method' }
            : path.includes('initialize') ? { success: true, reference: 'local-reference', authorizationUrl: 'https://checkout.flutterwave.com/test' }
                : { success: true, request: { id: 'booking' } } })),
    };
});

describe('web and app payment routing', () => {
    it('uses exactly the same local-currency set as the app', () => {
        const dart = readFileSync(new URL('../../bago_new_design_app/lib/features/payment/services/stripe_checkout_service.dart', import.meta.url), 'utf8');
        const list = dart.match(/const flutterwaveOnlyCurrencies = \{([\s\S]*?)\};/)[1];
        expect([...FLUTTERWAVE_ONLY_CURRENCIES].sort()).toEqual([...list.matchAll(/'([A-Z]{3})'/g)].map(match => match[1]).sort());
        for (const currency of FLUTTERWAVE_ONLY_CURRENCIES) expect(paymentProviderForCurrency(currency)).toBe('flutterwave');
        for (const currency of ['EUR', 'GBP', 'USD', 'CAD', 'AUD']) expect(paymentProviderForCurrency(currency)).toBe('stripe');
    });

    it('prepares international cards and Apple Pay on Stripe with the complete price', async () => {
        const result = await preparePaymentCheckout(checkout, api, storage);
        expect(result.provider).toBe('stripe');
        expect(api.post).toHaveBeenCalledWith('/api/payments/create-intent', expect.objectContaining({ amount: 112.8,
            currency: 'EUR', insurance: true, termsAccepted: true, paymentMethodType: 'card', travelerId: 'traveler' }));
        const saved = JSON.parse(storage.getItem(CHECKOUT_STASH_KEY));
        expect(saved.reference).toBe('pi_mock');
        expect(saved).not.toHaveProperty('clientSecret');
    });

    it.each([false, 'network'])('does not fall back to Flutterwave when Stripe is unavailable (%s)', async failure => {
        if (failure === 'network') api.get.mockRejectedValue(new Error('offline'));
        else api.get.mockResolvedValue({ data: { enabled: false } });
        await expect(preparePaymentCheckout(checkout, api, storage)).rejects.toThrow('International card payments are temporarily unavailable');
        expect(api.post).not.toHaveBeenCalled();
    });

    it('local checkout does not contact Stripe', async () => {
        const result = await preparePaymentCheckout({ ...checkout, currency: 'NGN' }, api, storage);
        expect(result.provider).toBe('flutterwave');
        expect(api.get).not.toHaveBeenCalled();
        expect(api.post).toHaveBeenCalledWith('/api/payments/flutterwave/initialize', expect.objectContaining({ currency: 'NGN' }));
    });

    it('does not let an abandoned checkout overwrite the current payment session', async () => {
        storage.setItem(CHECKOUT_STASH_KEY, JSON.stringify({ reference: 'newer-checkout' }));
        await expect(preparePaymentCheckout(checkout, api, storage, () => false)).rejects.toThrow('Checkout changed');
        expect(JSON.parse(storage.getItem(CHECKOUT_STASH_KEY)).reference).toBe('newer-checkout');
    });

    it('routes additional weight using the server quote, rather than stale URL currency', async () => {
        api.post.mockImplementation(async path => ({ data: path.includes('preview')
            ? { success: true, preview: { packageId: 'pkg', tripId: 'trip', travelerId: 'traveler', totalAmount: 15000, senderCurrency: 'NGN' } }
            : { reference: 'local-reference', authorizationUrl: 'https://checkout.flutterwave.com/test' } }));
        const result = await preparePaymentCheckout({ ...checkout, requestId: 'shipment', additionalKg: 3 }, api, storage);
        expect(result).toMatchObject({ provider: 'flutterwave', currency: 'NGN', amount: 15000 });
        expect(api.get).not.toHaveBeenCalled();
        expect(api.post).toHaveBeenLastCalledWith('/api/payments/flutterwave/initialize', { requestId: 'shipment', additionalKg: 3, amount: 15000, currency: 'NGN' });
    });
});

describe('server-verified booking and recovery', () => {
    it('does not clear a newer session when an older booking response arrives', async () => {
        await preparePaymentCheckout(checkout, api, storage);
        api.post.mockImplementation(async () => {
            storage.setItem(CHECKOUT_STASH_KEY, JSON.stringify({ provider: 'stripe', reference: 'pi_newer' }));
            return { data: { success: true, request: { id: 'booking' } } };
        });
        await completePaymentCheckout('stripe', 'pi_mock', api, storage);
        expect(JSON.parse(storage.getItem(CHECKOUT_STASH_KEY)).reference).toBe('pi_newer');
    });
    it('sends the Stripe reference to the server before clearing the checkout', async () => {
        await preparePaymentCheckout(checkout, api, storage);
        const result = await completePaymentCheckout('stripe', 'pi_mock', api, storage);
        expect(result.request.id).toBe('booking');
        expect(api.post).toHaveBeenLastCalledWith('/api/bago/RequestPackage', expect.objectContaining({ paymentProvider: 'stripe', paymentReference: 'pi_mock', amount: 112.8, currency: 'EUR' }));
        expect(storage.getItem(CHECKOUT_STASH_KEY)).toBeNull();
    });

    it('rejects a forged return reference or mismatched provider', async () => {
        await preparePaymentCheckout(checkout, api, storage);
        api.post.mockClear();
        await expect(completePaymentCheckout('stripe', 'pi_other', api, storage)).rejects.toThrow('reference does not match');
        await expect(completePaymentCheckout('flutterwave', '123', api, storage)).rejects.toThrow('provider does not match');
        expect(api.post).not.toHaveBeenCalled();
    });

    it.each(['network', 'processing'])('keeps payment recovery data if finalization fails (%s)', async failure => {
        await preparePaymentCheckout(checkout, api, storage);
        if (failure === 'network') api.post.mockRejectedValue(new Error('offline'));
        else api.post.mockResolvedValue({ data: { success: true, paymentPending: true } });
        await expect(completePaymentCheckout('stripe', 'pi_mock', api, storage)).rejects.toThrow();
        expect(JSON.parse(storage.getItem(CHECKOUT_STASH_KEY)).reference).toBe('pi_mock');
    });

    it('verifies Flutterwave currency, amount and original reference before booking', async () => {
        await preparePaymentCheckout({ ...checkout, currency: 'NGN' }, api, storage);
        api.get.mockResolvedValue({ data: { success: true, reference: 'other-reference', amount: 112.8, currency: 'NGN' } });
        api.post.mockClear();
        await expect(completePaymentCheckout('flutterwave', '123', api, storage)).rejects.toThrow('awaiting verification');
        expect(api.post).not.toHaveBeenCalled();
        api.get.mockResolvedValue({ data: { success: true, reference: 'local-reference', amount: 112.8, currency: 'NGN' } });
        await expect(completePaymentCheckout('flutterwave', '123', api, storage)).resolves.toMatchObject({ request: { id: 'booking' } });
    });
});

describe('Stripe browser confirmation', () => {
    it('validates fields before attempting payment and preserves the 3DS return URL', async () => {
        const elements = { submit: vi.fn().mockResolvedValue({}) };
        const stripe = { confirmPayment: vi.fn().mockResolvedValue({ paymentIntent: { id: 'pi_mock', status: 'succeeded' } }) };
        expect((await confirmStripeWebPayment(stripe, elements, 'https://sendwithbago.com/payment/callback?provider=stripe')).id).toBe('pi_mock');
        expect(stripe.confirmPayment).toHaveBeenCalledWith({ elements, redirect: 'if_required', confirmParams: { return_url: 'https://sendwithbago.com/payment/callback?provider=stripe' } });
        elements.submit.mockResolvedValue({ error: { message: 'Incomplete card' } });
        stripe.confirmPayment.mockClear();
        await expect(confirmStripeWebPayment(stripe, elements, 'https://sendwithbago.com')).rejects.toThrow('Incomplete card');
        expect(stripe.confirmPayment).not.toHaveBeenCalled();
    });

    it.each(['Your card was declined', 'Payment cancelled'])('does not report a provider failure as paid (%s)', async message => {
        await expect(confirmStripeWebPayment({ confirmPayment: async () => ({ error: { message } }) }, { submit: async () => ({}) }, 'https://sendwithbago.com')).rejects.toThrow(message);
    });
});


describe('bounded payment confirmation recovery', () => {
    async function prepare() {
        await preparePaymentCheckout(checkout, api, storage);
        api.post.mockReset();
    }
    it('rechecks pending booking using the same payment without another charge', async () => {
        await prepare();
        api.post.mockResolvedValueOnce({ data: { success: true, paymentPending: true } })
            .mockResolvedValueOnce({ data: { success: true, request: { id: 'confirmed' } } });
        const wait = vi.fn().mockResolvedValue();
        const result = await confirmPaymentWithRetry('stripe', 'pi_mock', api, { storage, wait });
        expect(result.request.id).toBe('confirmed');
        expect(wait).toHaveBeenCalledWith(1500);
        expect(api.post).toHaveBeenCalledTimes(2);
        for (const [path, body] of api.post.mock.calls) {
            expect(path).toBe('/api/bago/RequestPackage');
            expect(body.paymentReference).toBe('pi_mock');
        }
        expect(storage.getItem(CHECKOUT_STASH_KEY)).toBeNull();
    });
    it('stops after four transient failures and preserves checkout', async () => {
        await prepare();
        api.post.mockRejectedValue({ code: 'ECONNABORTED' });
        await expect(confirmPaymentWithRetry('stripe', 'pi_mock', api, { storage, wait: async () => {} }))
            .rejects.toEqual({ code: 'ECONNABORTED' });
        expect(api.post).toHaveBeenCalledTimes(4);
        expect(storage.getItem(CHECKOUT_STASH_KEY)).not.toBeNull();
    });
    it('does not retry an ownership rejection or mismatching reference', async () => {
        await prepare();
        api.post.mockRejectedValue({ response: { status: 403 } });
        await expect(confirmPaymentWithRetry('stripe', 'pi_mock', api, { storage })).rejects.toEqual({ response: { status: 403 } });
        expect(api.post).toHaveBeenCalledTimes(1);
        api.post.mockClear();
        await expect(confirmPaymentWithRetry('stripe', 'pi_other', api, { storage })).rejects.toThrow('does not match');
        expect(api.post).not.toHaveBeenCalled();
    });
    it('stops requesting after leaving the page', async () => {
        await prepare();
        let active = true;
        api.post.mockRejectedValue({ code: 'ERR_NETWORK' });
        expect(await confirmPaymentWithRetry('stripe', 'pi_mock', api, { storage,
            isActive: () => active, wait: async () => { active = false; } })).toBeNull();
        expect(api.post).toHaveBeenCalledTimes(1);
    });
});
