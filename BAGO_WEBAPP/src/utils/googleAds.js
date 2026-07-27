const SIGNUP_CONVERSION_ID = 'AW-18350483846/5QpPCP_E3NYcEIbTmK5E';

export function trackSignupConversion(userId) {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    // Prevent duplicate conversion events caused by retries, redirects, or
    // React development remounts. Each confirmed account is counted once per
    // browser while Google Ads handles its own attribution/deduplication.
    const key = `bago_signup_conversion_${userId || 'confirmed'}`;
    try {
        if (window.localStorage.getItem(key)) return;
        window.localStorage.setItem(key, new Date().toISOString());
    } catch {
        // Tracking should never interrupt a successful signup.
    }

    window.gtag('event', 'conversion', {
        send_to: SIGNUP_CONVERSION_ID,
        transaction_id: userId || '',
    });
}
