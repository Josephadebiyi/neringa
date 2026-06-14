import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import api from '../api';

function loadStripeJs() {
    return new Promise((resolve, reject) => {
        if (window.Stripe) return resolve(window.Stripe);
        const existing = document.getElementById('stripe-js');
        if (existing) {
            existing.addEventListener('load', () => resolve(window.Stripe));
            existing.addEventListener('error', () => reject(new Error('Could not load secure payments.')));
            return;
        }
        const script = document.createElement('script');
        script.id = 'stripe-js';
        script.src = 'https://js.stripe.com/v3/';
        script.onload = () => resolve(window.Stripe);
        script.onerror = () => reject(new Error('Could not load secure payments.'));
        document.head.appendChild(script);
    });
}

const paymentErrorMessage = (error, fallback) => (
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback
);

export default function PaymentCheckout() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const stripeRef = useRef(null);
    const elementsRef = useRef(null);
    const expressCheckoutRef = useRef(null);
    const paymentElementRef = useRef(null);
    const paymentIntentRef = useRef(null);
    const [error, setError] = useState('');
    const [ready, setReady] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [methodEligibility, setMethodEligibility] = useState(null);

    const checkout = useMemo(() => ({
        packageId: params.get('packageId') || '',
        tripId: params.get('tripId') || '',
        travelerId: params.get('travelerId') || '',
        currency: params.get('currency') || 'USD',
        amount: Number(params.get('amount') || 0),
        insurance: params.get('insurance') === 'true',
        insuranceCost: Number(params.get('insuranceCost') || 0),
        estimatedDeparture: params.get('estimatedDeparture') || '',
    }), [params]);

    useEffect(() => {
        let mounted = true;

        const boot = async () => {
            try {
                if (!checkout.packageId || !checkout.tripId || !checkout.travelerId || checkout.amount <= 0) {
                    throw new Error('Checkout details are incomplete.');
                }

                const config = await api.get('/api/config/stripe');
                const publishableKey = config.data?.publishableKey;
                if (!publishableKey) throw new Error('Secure payments are not configured.');

                const methods = await api.get('/api/payments/methods', {
                    params: {
                        currency: checkout.currency,
                        captureMethod: 'automatic',
                    },
                });
                if (!mounted) return;
                setMethodEligibility(methods.data);

                const Stripe = await loadStripeJs();
                if (!mounted) return;
                const stripe = Stripe(publishableKey);
                stripeRef.current = stripe;

                const intent = await createPaymentIntent(methods.data?.countryCode);
                if (!mounted) return;
                paymentIntentRef.current = intent;

                const elements = stripe.elements({
                    clientSecret: intent.clientSecret,
                    appearance: {
                        theme: 'stripe',
                        variables: {
                            colorPrimary: '#5845D8',
                            colorText: '#012126',
                            borderRadius: '14px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
                        },
                    },
                });
                const expressCheckout = elements.create('expressCheckout', {
                    buttonType: { applePay: 'plain' },
                    buttonTheme: { applePay: 'black' },
                    buttonHeight: 48,
                });
                expressCheckout.on('confirm', async () => {
                    if (processing) return;
                    setProcessing(true);
                    setError('');
                    try {
                        const result = await stripe.confirmPayment({
                            elements,
                            confirmParams: { return_url: window.location.href },
                            redirect: 'if_required',
                        });
                        if (result.error) throw new Error(result.error.message);
                        const confirmedIntent = result.paymentIntent || paymentIntentRef.current;
                        await createShipment(
                            confirmedIntent.id || confirmedIntent.paymentIntentId,
                            confirmedIntent.payment_method_types?.[0] || 'apple_pay',
                        );
                    } catch (err) {
                        setProcessing(false);
                        setError(paymentErrorMessage(err, 'Apple Pay could not be completed.'));
                    }
                });
                expressCheckout.mount('#express-checkout-element');
                const paymentElement = elements.create('payment', { layout: 'tabs' });
                paymentElement.mount('#payment-element');
                elementsRef.current = elements;
                expressCheckoutRef.current = expressCheckout;
                paymentElementRef.current = paymentElement;
                setReady(true);
            } catch (err) {
                setError(paymentErrorMessage(err, 'Payment checkout could not load.'));
            }
        };

        boot();
        return () => {
            mounted = false;
            expressCheckoutRef.current?.unmount?.();
            paymentElementRef.current?.unmount?.();
        };
    }, [checkout.packageId, checkout.tripId, checkout.travelerId, checkout.amount, checkout.currency, checkout.insurance, checkout.insuranceCost]);

    const createPaymentIntent = async (countryCode) => {
        const response = await api.post('/api/payments/create-intent', {
            amount: checkout.amount,
            currency: checkout.currency,
            countryCode: countryCode || undefined,
            packageId: checkout.packageId,
            tripId: checkout.tripId,
            travelerId: checkout.travelerId,
            termsAccepted: true,
        });
        if (!response.data?.clientSecret || !response.data?.paymentIntentId) {
            throw new Error(response.data?.message || 'Could not start payment.');
        }
        return response.data;
    };

    const createShipment = async (paymentIntentId, paymentMethod) => {
        const shipmentAmount = Math.max(
            0,
            Number(checkout.amount || 0) - (checkout.insurance ? Number(checkout.insuranceCost || 0) : 0)
        );
        const response = await api.post('/api/bago/RequestPackage', {
            travelerId: checkout.travelerId,
            packageId: checkout.packageId,
            tripId: checkout.tripId,
            amount: shipmentAmount || checkout.amount,
            currency: checkout.currency,
            insurance: checkout.insurance,
            insuranceCost: checkout.insuranceCost,
            estimatedDeparture: checkout.estimatedDeparture,
            termsAccepted: true,
            paymentReference: paymentIntentId,
            paymentProvider: 'stripe',
        });
        const req = response.data?.request || response.data?.data || response.data;
        navigate('/shipping-success', {
            replace: true,
            state: {
                requestId: req?.id || req?._id,
                trackingNumber: req?.trackingNumber,
                amount: checkout.amount,
                currency: checkout.currency,
                paymentMethod,
            },
        });
    };

    const submitPayment = async () => {
        if (!stripeRef.current || !elementsRef.current || !paymentIntentRef.current || processing) return;
        setProcessing(true);
        setError('');
        try {
            const result = await stripeRef.current.confirmPayment({
                elements: elementsRef.current,
                confirmParams: { return_url: window.location.href },
                redirect: 'if_required',
            });
            if (result.error) throw new Error(result.error.message);
            const intent = result.paymentIntent || paymentIntentRef.current;
            await createShipment(
                intent.id || intent.paymentIntentId,
                intent.payment_method_types?.[0] || 'payment',
            );
        } catch (err) {
            setProcessing(false);
            setError(paymentErrorMessage(err, 'Payment could not be completed.'));
        }
    };

    const methodHint = (() => {
        return 'Cards and eligible wallet payments are available.';
    })();

    return (
        <div className="min-h-screen bg-[#f5f6f8] px-4 py-5 text-[#111827]">
            <div className="mx-auto max-w-5xl">
                <header className="mb-5 flex items-center justify-between">
                    <img src="/bago_logo.png" alt="Bago" className="h-9 w-auto" />
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-500">
                        <LockKeyhole size={13} /> Secure payment
                    </div>
                </header>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <main className="space-y-4">
                        <section className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_18px_42px_rgba(16,24,40,0.07)]">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-lg font-black tracking-tight">Payment method</h1>
                                    <p className="mt-1 text-xs font-bold text-gray-400">{methodHint}</p>
                                </div>
                                <CreditCard className="text-[#5845D8]" size={22} />
                            </div>
                            {error && <div className="mb-4 rounded-[14px] border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">{error}</div>}
                            <div id="express-checkout-element" className="mb-4" />
                            <div id="payment-element" className="min-h-[112px] rounded-[14px] border border-gray-200 bg-gray-50/60 p-4" />
                            <button onClick={submitPayment} disabled={!ready || processing} className="mt-5 flex h-14 w-full items-center justify-center rounded-[15px] bg-[#5845D8] text-base font-black text-white shadow-lg shadow-[#5845D8]/20 disabled:opacity-50">
                                {processing ? 'Processing...' : `Pay ${checkout.currency} ${checkout.amount.toFixed(2)}`}
                            </button>
                        </section>
                    </main>

                    <aside className="h-fit rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_18px_42px_rgba(16,24,40,0.07)] lg:sticky lg:top-5">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total to pay</p>
                        <p className="mt-2 text-3xl font-black text-[#012126]">{checkout.currency} {checkout.amount.toFixed(2)}</p>
                        <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-500">Final Bago checkout total. Your payment is held securely until the shipment is completed.</p>
                        <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs font-black text-gray-500">
                            <ShieldCheck size={15} /> Encrypted checkout
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
