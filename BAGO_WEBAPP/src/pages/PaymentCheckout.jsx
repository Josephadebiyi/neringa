import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LockKeyhole, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api';

const CHECKOUT_STASH_KEY = 'bago_flutterwave_checkout';

function checkoutErrorMessage(error, fallback = 'Payment checkout could not load.') {
    const data = error?.response?.data;
    const raw = data?.message || data?.error || error?.message || fallback;
    const value = String(raw || '').toLowerCase();
    if (
        data?.code === 'EXCHANGE_RATE_EXPIRED' ||
        data?.code === 'EXCHANGE_RATE_MISSING' ||
        value.includes('exchange rates are stale') ||
        value.includes('exchange rates are not available') ||
        value.includes('exchange rate refresh failed') ||
        value.includes('exchange rate missing')
    ) {
        return 'Pricing is temporarily unavailable while exchange rates refresh. Please try again in a few minutes.';
    }
    return raw;
}

// Flutterwave is the sole active payment provider. Unlike PayPal's inline SDK,
// Flutterwave Standard checkout is a hosted-page redirect — the browser leaves
// Bago entirely, so checkout details are stashed in sessionStorage before
// redirecting out and read back by PaymentCallback.jsx on return.
export default function PaymentCheckout() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [redirecting, setRedirecting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [authorizationUrl, setAuthorizationUrl] = useState('');

    const checkout = useMemo(() => ({
        packageId:          params.get('packageId')          || '',
        tripId:             params.get('tripId')             || '',
        travelerId:         params.get('travelerId')         || '',
        currency:           (params.get('currency')          || 'USD').toUpperCase(),
        amount:             Number(params.get('amount')      || 0),
        insurance:          params.get('insurance')          === 'true',
        insuranceCost:      Number(params.get('insuranceCost') || 0),
        estimatedDeparture: params.get('estimatedDeparture') || '',
        requestId:          params.get('requestId')          || '',
        additionalKg:       Number(params.get('additionalKg') || 0),
    }), [params]);

    const isAddKgMode = Boolean(checkout.requestId && checkout.additionalKg > 0);

    useEffect(() => {
        const invalid = isAddKgMode
            ? (!checkout.requestId || checkout.additionalKg <= 0 || checkout.amount <= 0)
            : (!checkout.packageId || !checkout.tripId || !checkout.travelerId || checkout.amount <= 0);

        if (invalid) {
            setError('Checkout details are incomplete. Please go back and try again.');
            setLoading(false);
            return;
        }

        let alive = true;

        async function boot() {
            try {
                const initBody = isAddKgMode ? {
                    requestId:    checkout.requestId,
                    additionalKg: checkout.additionalKg,
                    amount:       checkout.amount,
                    currency:     checkout.currency,
                } : {
                    packageId: checkout.packageId,
                    tripId:    checkout.tripId,
                    amount:    checkout.amount,
                    currency:  checkout.currency,
                    metadata: {
                        insurance:     checkout.insurance,
                        insuranceCost: checkout.insuranceCost,
                    },
                };
                const res = await api.post('/api/payments/flutterwave/initialize', initBody);
                if (!alive) return;
                const url = res.data?.authorizationUrl || res.data?.data?.authorizationUrl;
                const reference = res.data?.reference || res.data?.data?.reference;
                if (!url || !reference) {
                    throw new Error(res.data?.message || 'Could not start checkout.');
                }

                // Stash everything PaymentCallback.jsx needs to create the shipment
                // once Flutterwave redirects back — the return URL only carries the
                // transaction reference, not the full checkout context.
                sessionStorage.setItem(CHECKOUT_STASH_KEY, JSON.stringify({
                    ...checkout,
                    isAddKgMode,
                    reference,
                }));

                setAuthorizationUrl(url);
            } catch (err) {
                if (!alive) return;
                setError(checkoutErrorMessage(err));
            } finally {
                if (alive) setLoading(false);
            }
        }

        boot();
        return () => { alive = false; };
    }, [checkout.packageId, checkout.tripId, checkout.travelerId, checkout.requestId, checkout.additionalKg, checkout.amount, checkout.currency, isAddKgMode]);

    const goToFlutterwave = () => {
        if (!authorizationUrl) return;
        setRedirecting(true);
        window.location.href = authorizationUrl;
    };

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
                            <div className="mb-5">
                                <h1 className="text-lg font-black tracking-tight">Pay securely</h1>
                                <p className="mt-1 text-xs font-bold text-gray-400">
                                    Card, Apple Pay, bank transfer & mobile money — choose your method on the next page.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mb-4 flex items-start gap-3 rounded-[14px] border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-600">
                                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                                    {error}
                                </div>
                            )}

                            {(loading || redirecting) && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <div className="w-8 h-8 border-2 border-[#5845D8] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                        {redirecting ? 'Redirecting to secure payment…' : 'Preparing checkout…'}
                                    </p>
                                </div>
                            )}

                            {!loading && !redirecting && !error && (
                                <button
                                    onClick={goToFlutterwave}
                                    className="w-full rounded-2xl bg-[#012126] py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-[#0a262c]"
                                >
                                    Continue to payment
                                </button>
                            )}

                            <p className="mt-4 text-center text-[10px] text-gray-400 font-medium">
                                By completing this payment you agree to Bago's terms of service.
                            </p>
                        </section>
                    </main>

                    {/* Order summary */}
                    <aside className="h-fit rounded-[22px] border border-gray-200 bg-white p-5 shadow-[0_18px_42px_rgba(16,24,40,0.07)] lg:sticky lg:top-5">
                        {isAddKgMode && (
                            <div className="mb-4 rounded-[14px] bg-[#5845D8]/5 border border-[#5845D8]/10 px-4 py-3">
                                <p className="text-[8px] font-black text-[#5845D8] uppercase tracking-widest mb-1">Additional Weight</p>
                                <p className="text-base font-black text-[#012126]">+{checkout.additionalKg} KG</p>
                                <p className="text-[9px] text-gray-400 font-bold mt-0.5">Added to existing shipment</p>
                            </div>
                        )}
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Order total</p>
                        <p className="mt-2 text-3xl font-black text-[#012126]">
                            {checkout.currency} {checkout.amount.toFixed(2)}
                        </p>

                        {!isAddKgMode && checkout.insurance && checkout.insuranceCost > 0 && (
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
                            {isAddKgMode
                                ? 'Payment is added to your active shipment and held in escrow until delivery.'
                                : 'Payment is held securely until your shipment is delivered and confirmed.'
                            }
                        </p>

                        <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs font-black text-gray-400">
                            <ShieldCheck size={14} /> Secured by Bago
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

export { CHECKOUT_STASH_KEY };
