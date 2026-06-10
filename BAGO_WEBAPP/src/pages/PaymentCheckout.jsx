import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, LockKeyhole, ShieldCheck } from 'lucide-react';
import api from '../api';

const loadScript = (src, id) => new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
        if (existing.dataset.loaded === 'true') resolve();
        else existing.addEventListener('load', resolve, { once: true });
        return;
    }
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => {
        script.dataset.loaded = 'true';
        resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
});

const paymentErrorMessage = (error, fallback) => (
    error?.response?.data?.message
    || error?.response?.data?.error
    || error?.message
    || fallback
);

export default function PaymentCheckout() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [ready, setReady] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [appleReady, setAppleReady] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);
    const cardRef = useRef(null);
    const mountedRef = useRef(false);
    const applePayRef = useRef(null);
    const googleConfigRef = useRef(null);
    const googleClientRef = useRef(null);

    const checkout = useMemo(() => ({
        packageId: params.get('packageId') || '',
        tripId: params.get('tripId') || '',
        currency: params.get('currency') || 'USD',
        amount: Number(params.get('amount') || 0),
        insurance: params.get('insurance') === 'true',
        insuranceCost: Number(params.get('insuranceCost') || 0),
    }), [params]);

    useEffect(() => {
        if (mountedRef.current) return;
        mountedRef.current = true;

        const boot = async () => {
            try {
                const config = await api.get('/api/config/paypal');
                const clientId = config.data?.clientId;
                if (!clientId) throw new Error('PayPal is not configured.');
                await loadScript('https://pay.google.com/gp/p/js/pay.js', 'google-pay-sdk').catch(() => {});
                await loadScript(`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&components=buttons,card-fields,applepay,googlepay&intent=capture`, 'paypal-sdk');

                if (!window.paypal) throw new Error('PayPal checkout could not load.');
                renderPayPalButtons();
                renderCardFields();
                setupApplePay();
                setupGooglePay(config.data?.isSandbox !== false);
                setReady(true);
            } catch (err) {
                setError(err.message || 'Payment checkout could not load.');
            }
        };

        boot();
    }, []);

    const createOrder = async (paymentMethod) => {
        try {
            setError('');
            const response = await api.post('/api/payments/paypal/create-order', {
                packageId: checkout.packageId,
                tripId: checkout.tripId,
                currency: checkout.currency,
                insurance: checkout.insurance,
                insuranceCost: checkout.insuranceCost,
                paymentMethod,
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Could not create payment order.');
            }
            return response.data.data.orderId;
        } catch (err) {
            throw new Error(paymentErrorMessage(err, 'Could not create payment order.'));
        }
    };

    const captureOrder = async (orderId) => {
        try {
            const response = await api.post('/api/payments/paypal/capture-order', {
                orderId,
                packageId: checkout.packageId,
                tripId: checkout.tripId,
                currency: checkout.currency,
                insurance: checkout.insurance,
                insuranceCost: checkout.insuranceCost,
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Payment could not be completed.');
            }
            const req = response.data?.data?.request;
            navigate('/shipping-success', {
                replace: true,
                state: {
                    requestId: req?.id || req?._id,
                    trackingNumber: req?.trackingNumber,
                    amount: checkout.amount,
                    currency: checkout.currency,
                    paymentMethod: 'paypal',
                },
            });
        } catch (err) {
            throw new Error(paymentErrorMessage(err, 'Payment could not be completed.'));
        }
    };

    const renderPayPalButtons = () => {
        window.paypal.Buttons({
            createOrder: () => createOrder('paypal_wallet'),
            onApprove: ({ orderID }) => captureOrder(orderID),
            onError: (err) => setError(paymentErrorMessage(err, 'PayPal payment failed.')),
            style: { layout: 'horizontal', color: 'blue', shape: 'rect', label: 'pay', height: 52, tagline: false },
        }).render('#paypal-button-container');
    };

    const renderCardFields = () => {
        const fields = window.paypal.CardFields({
            createOrder: () => createOrder('card'),
            onApprove: ({ orderID }) => captureOrder(orderID),
            onError: (err) => {
                setProcessing(false);
                setError(err?.message || 'Card payment failed.');
            },
            style: {
                input: {
                    'font-size': '15px',
                    'font-family': '-apple-system, BlinkMacSystemFont, sans-serif',
                    'font-weight': '700',
                    color: '#111827',
                    padding: '0',
                    border: 'none',
                    outline: 'none',
                    'box-shadow': 'none',
                    background: 'transparent',
                    height: '48px',
                },
                ':focus': {
                    color: '#111827',
                    outline: 'none',
                    border: 'none',
                    'box-shadow': 'none',
                },
                '.invalid': {
                    color: '#dc2626',
                },
            },
        });
        if (!fields.isEligible()) {
            setError('Card payment is not available right now.');
            return;
        }
        fields.NumberField().render('#card-number-field');
        fields.ExpiryField().render('#card-expiry-field');
        fields.CVVField().render('#card-cvv-field');
        cardRef.current = fields;
    };

    const setupApplePay = () => {
        if (!window.ApplePaySession || !window.paypal?.Applepay) return;
        const applepay = window.paypal.Applepay();
        applepay.config().then((config) => {
            if (!config.isEligible) return;
            applePayRef.current = { applepay, config };
            setAppleReady(true);
        }).catch(() => {});
    };

    const startApplePay = () => {
        const setup = applePayRef.current;
        if (!setup || !window.ApplePaySession) return;
        setError('');
        let orderId = '';

        try {
            const { applepay, config } = setup;
            const session = new window.ApplePaySession(3, {
                countryCode: config.countryCode || 'US',
                currencyCode: checkout.currency,
                merchantCapabilities: config.merchantCapabilities || ['supports3DS'],
                supportedNetworks: config.supportedNetworks || ['visa', 'masterCard', 'amex'],
                total: { label: 'Bago', amount: checkout.amount.toFixed(2) },
            });

            session.onvalidatemerchant = async (event) => {
                try {
                    orderId = await createOrder('apple_pay');
                    const { merchantSession } = await applepay.validateMerchant({
                        validationUrl: event.validationURL,
                        orderId,
                    });
                    session.completeMerchantValidation(merchantSession);
                } catch (err) {
                    setError(paymentErrorMessage(err, 'Apple Pay could not start.'));
                    session.abort();
                }
            };

            session.onpaymentauthorized = async (event) => {
                try {
                    if (!orderId) orderId = await createOrder('apple_pay');
                    await applepay.confirmOrder({
                        orderId,
                        token: event.payment.token,
                        billingContact: event.payment.billingContact,
                    });
                    session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
                    await captureOrder(orderId);
                } catch (err) {
                    session.completePayment(window.ApplePaySession.STATUS_FAILURE);
                    setError(paymentErrorMessage(err, 'Apple Pay failed.'));
                }
            };

            session.oncancel = () => setProcessing(false);
            session.begin();
        } catch (err) {
            setError(paymentErrorMessage(err, 'Apple Pay failed.'));
        }
    };

    const setupGooglePay = (isSandbox) => {
        if (!window.google?.payments?.api || !window.paypal?.Googlepay) return;
        const googlepay = window.paypal.Googlepay();
        const paymentsClient = new window.google.payments.api.PaymentsClient({
            environment: isSandbox ? 'TEST' : 'PRODUCTION',
        });
        googleClientRef.current = paymentsClient;

        googlepay.config().then((config) => {
            const allowedPaymentMethods = config.allowedPaymentMethods || [];
            googleConfigRef.current = { config, allowedPaymentMethods, googlepay };
            return paymentsClient.isReadyToPay({
                apiVersion: config.apiVersion || 2,
                apiVersionMinor: config.apiVersionMinor || 0,
                allowedPaymentMethods,
            });
        }).then((response) => {
            setGoogleReady(response?.result === true);
        }).catch(() => {});
    };

    const startGooglePay = async () => {
        const setup = googleConfigRef.current;
        const client = googleClientRef.current;
        if (!setup || !client) return;
        try {
            const orderId = await createOrder('google_pay');
            const paymentData = await client.loadPaymentData({
                apiVersion: setup.config.apiVersion || 2,
                apiVersionMinor: setup.config.apiVersionMinor || 0,
                allowedPaymentMethods: setup.allowedPaymentMethods,
                merchantInfo: setup.config.merchantInfo,
                transactionInfo: {
                    countryCode: setup.config.countryCode || 'US',
                    currencyCode: checkout.currency,
                    totalPriceStatus: 'FINAL',
                    totalPrice: checkout.amount.toFixed(2),
                },
            });
            await setup.googlepay.confirmOrder({
                orderId,
                paymentMethodData: paymentData.paymentMethodData,
            });
            await captureOrder(orderId);
        } catch (err) {
            setError(err.message || 'Google Pay failed.');
        }
    };

    const submitCard = async () => {
        if (!cardRef.current || processing) return;
        setProcessing(true);
        setError('');
        const name = document.getElementById('card-name-input')?.value?.trim();
        try {
            await cardRef.current.submit(name ? { cardholderName: name } : {});
        } catch (err) {
            setProcessing(false);
            setError(err.message || 'Please check your card details.');
        }
    };

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
                                    <h1 className="text-lg font-black tracking-tight">Card payment</h1>
                                    <p className="mt-1 text-xs font-bold text-gray-400">Visa, Mastercard and supported debit cards.</p>
                                </div>
                                <CreditCard className="text-[#5845D8]" size={22} />
                            </div>
                            {error && <div className="mb-4 rounded-[14px] border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">{error}</div>}
                            <PaymentField label="Card number" id="card-number-field" />
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <PaymentField label="Expiry" id="card-expiry-field" />
                                <PaymentField label="CVV" id="card-cvv-field" />
                            </div>
                            <label className="mt-3 block text-xs font-black text-gray-500">Cardholder name (optional)</label>
                            <input id="card-name-input" className="mt-2 h-14 w-full rounded-[14px] border border-gray-200 bg-white px-4 text-sm font-bold outline-none transition placeholder:text-gray-400 focus:border-[#5845D8]/50 focus:shadow-[0_0_0_4px_rgba(88,69,216,0.08)]" placeholder="Name on card" autoComplete="cc-name" />
                            <button onClick={submitCard} disabled={!ready || processing} className="mt-5 flex h-14 w-full items-center justify-center rounded-[15px] bg-[#5845D8] text-base font-black text-white shadow-lg shadow-[#5845D8]/20 disabled:opacity-50">
                                {processing ? 'Processing...' : `Pay ${checkout.currency} ${checkout.amount.toFixed(2)}`}
                            </button>
                        </section>

                        <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-400">
                            <div className="h-px flex-1 bg-gray-200" /> or pay another way <div className="h-px flex-1 bg-gray-200" />
                        </div>

                        <section className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_18px_42px_rgba(16,24,40,0.07)]">
                            <h2 className="text-lg font-black tracking-tight">Wallets and PayPal</h2>
                            <p className="mt-1 text-xs font-bold text-gray-400">Apple Pay appears on eligible Safari/iOS devices.</p>
                            {appleReady ? (
                                <button onClick={startApplePay} className="mt-4 h-14 w-full rounded-[14px] bg-black text-base font-black text-white">
                                    Pay with Apple Pay
                                </button>
                            ) : (
                                <div className="mt-4 rounded-[14px] border border-dashed border-gray-300 bg-gray-50 p-3 text-xs font-bold text-gray-500">
                                    Apple Pay is only available on eligible Apple Pay devices and Safari.
                                </div>
                            )}
                            {googleReady ? (
                                <button onClick={startGooglePay} className="mt-3 h-14 w-full rounded-[14px] bg-black text-base font-black text-white">
                                    Pay with Google Pay
                                </button>
                            ) : (
                                <div className="mt-3 rounded-[14px] border border-dashed border-gray-300 bg-gray-50 p-3 text-xs font-bold text-gray-500">
                                    Google Pay is shown on eligible browsers and devices.
                                </div>
                            )}
                            <div id="paypal-button-container" className="mt-4 min-h-[52px]" />
                        </section>
                    </main>

                    <aside className="h-fit rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_18px_42px_rgba(16,24,40,0.07)] lg:sticky lg:top-5">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Total to pay</p>
                        <p className="mt-2 text-3xl font-black text-[#012126]">{checkout.currency} {checkout.amount.toFixed(2)}</p>
                        <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-500">Final Bago checkout total. Your payment is secured until the shipment is completed.</p>
                        <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs font-black text-gray-500">
                            <ShieldCheck size={15} /> Encrypted checkout
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function PaymentField({ label, id }) {
    return (
        <div>
            <label className="block text-xs font-black text-gray-500">{label}</label>
            <div className="mt-2 flex h-14 items-center overflow-hidden rounded-[14px] border border-gray-200 bg-[#f9fafb] px-4 transition focus-within:border-[#5845D8]/50 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(88,69,216,0.08)]">
                <div id={id} className="flex h-12 w-full items-center overflow-hidden [&>iframe]:!h-12 [&>iframe]:!w-full [&>iframe]:!border-0 [&>iframe]:!outline-none [&>iframe]:!shadow-none" />
            </div>
        </div>
    );
}
