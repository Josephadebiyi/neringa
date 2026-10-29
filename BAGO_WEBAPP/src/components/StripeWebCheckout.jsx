import React, { useEffect, useRef, useState } from 'react';
import { confirmStripeWebPayment, loadStripeWeb } from '../utils/stripeWeb';

export default function StripeWebCheckout({ checkout, onPaid }) {
    const cardContainer = useRef(null);
    const applePayContainer = useRef(null);
    const integration = useRef(null);
    const confirming = useRef(false);
    const onPaidRef = useRef(onPaid);
    onPaidRef.current = onPaid;
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);
    const [applePayAvailable, setApplePayAvailable] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;
        const mounted = [];
        setReady(false);
        setError('');
        const confirm = async () => {
            if (!alive || confirming.current || !integration.current) return;
            confirming.current = true;
            setBusy(true);
            setError('');
            try {
                const { stripe, elements } = integration.current;
                const intent = await confirmStripeWebPayment(stripe, elements,
                    `${window.location.origin}/payment/callback?provider=stripe`);
                if (alive) onPaidRef.current(intent.id);
            } catch (failure) {
                if (alive) setError(failure.message);
            } finally {
                confirming.current = false;
                if (alive) setBusy(false);
            }
        };
        (async () => {
            try {
                const stripe = await loadStripeWeb(checkout.publishableKey);
                if (!alive) return;
                const elements = stripe.elements({ clientSecret: checkout.clientSecret,
                    appearance: { theme: 'stripe', variables: { colorPrimary: '#5C4BFD', borderRadius: '14px' } } });
                integration.current = { stripe, elements, confirm };
                const card = elements.create('payment', {
                    layout: 'tabs', paymentMethodOrder: ['card'], wallets: { applePay: 'never', googlePay: 'never' },
                });
                card.on('ready', () => alive && setReady(true));
                card.on('loaderror', () => alive && setError('Secure card entry could not load. Please refresh and try again.'));
                mounted.push(card);
                card.mount(cardContainer.current);
                const express = elements.create('expressCheckout', {
                    paymentMethods: { applePay: 'auto', googlePay: 'never', link: 'never', paypal: 'never', amazonPay: 'never', klarna: 'never' },
                    buttonType: { applePay: 'check-out' }, buttonHeight: 48,
                });
                express.on('ready', ({ availablePaymentMethods }) => alive && setApplePayAvailable(Boolean(availablePaymentMethods?.applePay)));
                express.on('availablepaymentmethodschange', ({ paymentMethods }) => alive && setApplePayAvailable(Boolean(paymentMethods?.applePay)));
                express.on('confirm', confirm);
                express.on('cancel', () => { if (alive) { confirming.current = false; setBusy(false); } });
                mounted.push(express);
                express.mount(applePayContainer.current);
            } catch (failure) {
                if (alive) setError(failure.message || 'Secure card checkout could not load.');
            }
        })();
        return () => {
            alive = false;
            integration.current = null;
            mounted.forEach(element => element.destroy());
        };
    }, [checkout.clientSecret, checkout.publishableKey]);

    return <form onSubmit={event => { event.preventDefault(); if (ready) integration.current?.confirm(); }} className="space-y-5" aria-busy={busy}>
        <div className={applePayAvailable ? 'space-y-3' : 'h-0 overflow-hidden'} aria-hidden={!applePayAvailable}>
            {applePayAvailable && <p className="text-sm font-bold">Apple Pay</p>}
            <div ref={applePayContainer} />
            {applePayAvailable && <p className="text-center text-xs text-gray-500">or pay by card</p>}
        </div>
        <div>
            <h2 className="mb-3 text-sm font-bold">Credit / debit card</h2>
            <div ref={cardContainer} />
        </div>
        {!ready && !error && <p role="status" className="text-sm text-gray-500">Loading secure payment options…</p>}
        {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={!ready || busy} className="w-full rounded-2xl bg-[#5845D8] py-4 text-sm font-bold text-white disabled:opacity-50">
            {busy ? 'Confirming payment…' : `Pay ${checkout.currency} ${Number(checkout.amount).toFixed(2)}`}
        </button>
        <p className="text-center text-xs text-gray-500">Securely processed by Stripe. Apple Pay is shown when available on your device and browser.</p>
    </form>;
}
