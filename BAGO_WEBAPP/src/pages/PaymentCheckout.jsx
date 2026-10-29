import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LockKeyhole, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../api';
import { customerError } from '../utils/customerErrors';

import StripeWebCheckout from '../components/StripeWebCheckout';
import { preloadStripeWeb } from '../utils/stripeWeb';
import { paymentProviderForCurrency, preparePaymentCheckout } from '../utils/paymentCheckout';
export { CHECKOUT_STASH_KEY } from '../utils/paymentCheckout';

const checkoutErrorMessage = error => customerError(error, 'Payment checkout could not load. Please try again.');

export default function PaymentCheckout() {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    const [error, setError] = useState('');
    const [redirecting, setRedirecting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [prepared, setPrepared] = useState(null);
    const [quotedCheckout, setQuotedCheckout] = useState(null);

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
        const invalid = !Number.isFinite(checkout.amount) || checkout.amount <= 0 || (isAddKgMode
            ? (!checkout.requestId || checkout.additionalKg <= 0 || checkout.amount <= 0)
            : (!checkout.packageId || !checkout.tripId || !checkout.travelerId || checkout.amount <= 0));

        if (invalid) {
            setError('Checkout details are incomplete. Please go back and try again.');
            setLoading(false);
            return;
        }

        let alive = true;
        // Download secure card entry while the server prepares the intent.
        if (!isAddKgMode && paymentProviderForCurrency(checkout.currency) === 'stripe') {
            void preloadStripeWeb().catch(() => {});
        }

        setLoading(true);
        setError('');
        setPrepared(null);
        async function boot() {
            try {
                const result = await preparePaymentCheckout(checkout, api, sessionStorage, () => alive);
                if (!alive) return;
                setPrepared(result);
                setQuotedCheckout(result);
            } catch (err) {
                if (alive) setError(checkoutErrorMessage(err));
            } finally {
                if (alive) setLoading(false);
            }
        }
        boot();
        return () => { alive = false; };
    }, [checkout, isAddKgMode]);

    const continueStripeBooking = (reference = prepared?.reference) => {
        navigate(`/payment/callback?provider=stripe&payment_intent=${encodeURIComponent(reference)}`);
    };

    const goToFlutterwave = () => {
        if (!prepared?.authorizationUrl) return;
        setRedirecting(true);
        window.location.assign(prepared.authorizationUrl);
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
                                <h1 className="text-lg font-black tracking-tight">Pay Now</h1>
                                <p className="mt-1 text-xs font-bold text-gray-400">
                                    {prepared?.provider === 'stripe'
                                        ? 'Pay by card or use Apple Pay when available.'
                                        : prepared?.provider === 'flutterwave'
                                            ? 'Choose from the payment methods available for your currency on Flutterwave.'
                                            : 'Preparing the payment options for your currency.'}
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

                            {!loading && !redirecting && !error && prepared?.provider === 'flutterwave' && (
                                <button
                                    onClick={goToFlutterwave}
                                    className="w-full rounded-2xl bg-[#5845D8] py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-[#5845D8]/20 transition-all hover:bg-[#4838B5]"
                                >
                                    Continue to Flutterwave
                                </button>
                            )}

                            {!loading && !error && prepared?.provider === 'stripe' && (
                                ['succeeded', 'processing'].includes(prepared.paymentStatus)
                                    ? <button onClick={() => continueStripeBooking()} className="w-full rounded-2xl bg-[#5845D8] py-4 font-bold text-white">Continue to shipment confirmation</button>
                                    : <StripeWebCheckout checkout={prepared} onPaid={continueStripeBooking} />
                            )}

                            <p className="mt-4 text-center text-[10px] text-gray-400 font-medium">
                                By completing this payment you agree to Bago’s <Link to="/terms" className="underline">Terms</Link> and <Link to="/refund-policy" className="underline">Refund and Cancellation Policy</Link>. <Link to="/contact" className="underline">Contact us</Link>.
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
                                {quotedCheckout?.weightQuote && <p className="text-xs text-gray-600 mt-2">Trip rate: {quotedCheckout.weightQuote.travelerCurrency} {quotedCheckout.weightQuote.travelerPricePerKg}/kg. Standard fees and any currency conversion are included in the total below.</p>}
                            </div>
                        )}
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Order total</p>
                        <p className="mt-2 text-3xl font-black text-[#012126]">
                            {(quotedCheckout || checkout).currency} {(quotedCheckout || checkout).amount.toFixed(2)}
                        </p>

                        {!isAddKgMode && checkout.insurance && checkout.insuranceCost > 0 && (
                            <div className="mt-3 space-y-2 text-xs font-bold text-gray-500">
                                <div className="flex justify-between">
                                    <span>Shipment</span>
                                    <span>{(quotedCheckout || checkout).currency} {((quotedCheckout || checkout).amount - checkout.insuranceCost).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Insurance</span>
                                    <span>{(quotedCheckout || checkout).currency} {checkout.insuranceCost.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-[#012126]">
                                    <span>Total</span>
                                    <span>{(quotedCheckout || checkout).currency} {(quotedCheckout || checkout).amount.toFixed(2)}</span>
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
