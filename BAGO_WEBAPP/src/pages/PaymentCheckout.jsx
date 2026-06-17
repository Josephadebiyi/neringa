import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LockKeyhole, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api';

function loadPayPalSdk(clientId, currency) {
    return new Promise((resolve, reject) => {
        const existingScript = document.getElementById('paypal-sdk');
        if (existingScript) {
            existingScript.remove();
        }
        const script = document.createElement('script');
        script.id = 'paypal-sdk';
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&components=buttons`;
        script.onload = () => resolve(window.paypal);
        script.onerror = () => reject(new Error('Could not load PayPal. Please refresh and try again.'));
        document.head.appendChild(script);
    });
}

export default function PaymentCheckout() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const buttonsRef = useRef(null);

    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkout = useMemo(() => ({
        packageId:          params.get('packageId')          || '',
        tripId:             params.get('tripId')             || '',
        travelerId:         params.get('travelerId')         || '',
        currency:           (params.get('currency')          || 'USD').toUpperCase(),
        amount:             Number(params.get('amount')      || 0),
        insurance:          params.get('insurance')          === 'true',
        insuranceCost:      Number(params.get('insuranceCost') || 0),
        estimatedDeparture: params.get('estimatedDeparture') || '',
    }), [params]);

    useEffect(() => {
        if (!checkout.packageId || !checkout.tripId || !checkout.travelerId || checkout.amount <= 0) {
            setError('Checkout details are incomplete. Please go back and try again.');
            setLoading(false);
            return;
        }

        let alive = true;

        async function boot() {
            try {
                const res = await api.get('/api/config/paypal');
                if (!alive) return;
                const cfg = res.data;
                if (!cfg?.clientId) throw new Error('PayPal checkout is not configured. Please contact support.');

                const paypal = await loadPayPalSdk(cfg.clientId, checkout.currency);
                if (!alive) return;

                if (buttonsRef.current) {
                    try { buttonsRef.current.close(); } catch (_) {}
                }

                const buttons = paypal.Buttons({
                    style: {
                        layout: 'vertical',
                        color:  'gold',
                        shape:  'rect',
                        label:  'pay',
                        height: 48,
                    },

                    createOrder: async () => {
                        setError('');
                        const orderRes = await api.post('/api/payments/paypal/create-order', {
                            packageId:          checkout.packageId,
                            tripId:             checkout.tripId,
                            travelerId:         checkout.travelerId,
                            amount:             checkout.amount,
                            currency:           checkout.currency,
                            insurance:          checkout.insurance,
                            insuranceCost:      checkout.insuranceCost,
                            estimatedDeparture: checkout.estimatedDeparture,
                            termsAccepted:      true,
                            paymentMethod:      'paypal',
                        });
                        if (!orderRes.data?.orderId) {
                            throw new Error(orderRes.data?.message || 'Could not start PayPal checkout.');
                        }
                        return orderRes.data.orderId;
                    },

                    onApprove: async ({ orderID }) => {
                        setProcessing(true);
                        setError('');
                        try {
                            const captureRes = await api.post('/api/payments/paypal/capture', { orderId: orderID });
                            if (!captureRes.data?.success) {
                                throw new Error(captureRes.data?.message || 'Payment capture failed.');
                            }

                            const shipRes = await api.post('/api/bago/RequestPackage', {
                                travelerId:         checkout.travelerId,
                                packageId:          checkout.packageId,
                                tripId:             checkout.tripId,
                                amount:             Math.max(0, checkout.amount - (checkout.insurance ? checkout.insuranceCost : 0)) || checkout.amount,
                                currency:           checkout.currency,
                                insurance:          checkout.insurance,
                                insuranceCost:      checkout.insuranceCost,
                                estimatedDeparture: checkout.estimatedDeparture,
                                termsAccepted:      true,
                                paymentReference:   orderID,
                                paymentProvider:    'paypal',
                            });

                            const shipData = shipRes.data?.request || shipRes.data?.data || shipRes.data;
                            navigate('/shipping-success', {
                                replace: true,
                                state: {
                                    requestId:      shipData?.id || shipData?._id,
                                    trackingNumber: shipData?.trackingNumber,
                                    amount:         checkout.amount,
                                    currency:       checkout.currency,
                                    paymentMethod:  'paypal',
                                },
                            });
                        } catch (err) {
                            setProcessing(false);
                            setError(err?.response?.data?.message || err?.message || 'Payment could not be completed.');
                        }
                    },

                    onError: (err) => {
                        setProcessing(false);
                        setError(err?.message || 'PayPal encountered an error. Please try again.');
                    },

                    onCancel: () => {
                        setProcessing(false);
                        setError('Payment was cancelled. You can try again below.');
                    },
                });

                buttonsRef.current = buttons;

                if (await buttons.isEligible()) {
                    buttons.render('#paypal-button-container');
                } else {
                    setError('PayPal is not available for this payment. Please contact support.');
                }
            } catch (err) {
                if (!alive) return;
                setError(err?.response?.data?.message || err?.message || 'Payment checkout could not load.');
            } finally {
                if (alive) setLoading(false);
            }
        }

        boot();
        return () => {
            alive = false;
            try { buttonsRef.current?.close?.(); } catch (_) {}
        };
    }, [checkout.packageId, checkout.tripId, checkout.travelerId, checkout.amount, checkout.currency]);

    return (
        <div className="min-h-screen bg-[#f5f6f8] px-4 py-5 text-[#111827]">
            <div className="mx-auto max-w-4xl">
                {/* Header */}
                <header className="mb-6 flex items-center justify-between">
                    <img src="/bago_logo.png" alt="Bago" className="h-9 w-auto" onError={e => { e.target.style.display='none'; }} />
                    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-black text-gray-500">
                        <LockKeyhole size={13} /> Secure checkout
                    </div>
                </header>

                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">

                    {/* Payment panel */}
                    <main>
                        <section className="rounded-[22px] border border-gray-200 bg-white p-6 shadow-[0_18px_42px_rgba(16,24,40,0.07)]">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-lg font-black tracking-tight">Pay with PayPal</h1>
                                    <p className="mt-1 text-xs font-bold text-gray-400">
                                        Secure checkout powered by PayPal. You can also pay by card through PayPal.
                                    </p>
                                </div>
                                <img src="/paypal-symbol.png" alt="PayPal" className="h-6 w-auto" />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mb-4 flex items-start gap-3 rounded-[14px] border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
                                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            {/* PayPal button container */}
                            {loading && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-8 h-8 border-2 border-[#009CDE] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading PayPal…</p>
                                </div>
                            )}

                            {processing && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-8 h-8 border-2 border-[#5845D8] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Processing payment…</p>
                                </div>
                            )}

                            <div
                                id="paypal-button-container"
                                className={loading || processing ? 'hidden' : ''}
                                style={{ minHeight: 50 }}
                            />

                            <p className="mt-4 text-center text-[10px] text-gray-400 font-medium">
                                By completing this payment you agree to Bago's terms of service.
                            </p>
                        </section>
                    </main>

                    {/* Order summary */}
                    <aside className="h-fit rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_18px_42px_rgba(16,24,40,0.07)] lg:sticky lg:top-5">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Order total</p>
                        <p className="mt-2 text-3xl font-black text-[#012126]">
                            {checkout.currency} {checkout.amount.toFixed(2)}
                        </p>

                        {checkout.insurance && checkout.insuranceCost > 0 && (
                            <div className="mt-3 space-y-2 text-xs font-bold text-gray-500">
                                <div className="flex justify-between">
                                    <span>Shipment</span>
                                    <span>{checkout.currency} {(checkout.amount - checkout.insuranceCost).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Insurance</span>
                                    <span>{checkout.currency} {checkout.insuranceCost.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-[#012126]">
                                    <span>Total</span>
                                    <span>{checkout.currency} {checkout.amount.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <p className="mt-4 text-xs font-semibold leading-relaxed text-gray-400">
                            Payment is held securely until your shipment is delivered and confirmed.
                        </p>

                        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs font-black text-gray-400">
                            <ShieldCheck size={14} /> PayPal Buyer Protection
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
