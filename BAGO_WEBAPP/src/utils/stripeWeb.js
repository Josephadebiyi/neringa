let scriptPromise;

export async function preloadStripeWeb() {
    if (!window.Stripe) {
        scriptPromise ||= new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = () => window.Stripe ? resolve() : reject(new Error('Secure card checkout could not load.'));
            script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error('Secure card checkout could not load. Check your connection and try again.')); };
            document.head.appendChild(script);
        });
        await scriptPromise;
    }
}

export async function loadStripeWeb(publishableKey) {
    await preloadStripeWeb();
    return window.Stripe(publishableKey);
}

export async function confirmStripeWebPayment(stripe, elements, returnUrl) {
    const submitted = await elements.submit();
    if (submitted.error) throw new Error(submitted.error.message || 'Check your payment details.');
    const result = await stripe.confirmPayment({
        elements, confirmParams: { return_url: returnUrl }, redirect: 'if_required',
    });
    if (result.error) throw new Error(result.error.message || 'Payment was not completed. Please try again.');
    if (!result.paymentIntent || !['succeeded', 'processing'].includes(result.paymentIntent.status)) {
        throw new Error('Payment has not completed. Please check your payment details.');
    }
    return result.paymentIntent;
}
