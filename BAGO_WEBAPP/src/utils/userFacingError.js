// Keeps technical / payment-provider error text away from users.
// Mirrors BAGO_BACKEND/utils/clientSafeMessage.js so an older backend build,
// or axios's own messages ("Request failed with status code 400",
// "Network Error"), can't leak into the UI either.

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.';
export const NETWORK_ERROR_MESSAGE = 'We couldn’t reach Bago. Check your internet connection and try again.';
export const TIMEOUT_ERROR_MESSAGE = 'This is taking longer than usual. Please try again.';

const TECHNICAL_PATTERNS = [
    /flutterwave|\bflw\b|stripe|paystack|prembly|dojah|mycover|resend|cloudinary|supabase|firebase|twilio|onrender|\brender\b|axios/i,
    /white-?list|ip address|api[ -]?key|secret key|public key|encryption key|authorization key|bearer|merchant|access control|not configured|\bsandbox\b|test mode|live mode|webhook/i,
    /\bIP\b/,
    /\b[A-Z][A-Z0-9]+_[A-Z0-9_]+\b/,
    /ECONN(REFUSED|RESET|ABORTED)|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|socket hang up|getaddrinfo|fetch failed|network error|timeout of \d+ms|request failed with status code|status code \d{3}|bad gateway|gateway timeout|service unavailable|internal server error/i,
    /cannot read propert|is not a function|is not defined|undefined|\bnull\b|\[object Object\]|\b(Type|Reference|Syntax|Range)Error\b|unexpected token|unexpected end of json|stack trace/i,
    /\brelation "|\bcolumn "|violates .* constraint|duplicate key|syntax error at|invalid input syntax|null value in column|\bsql\b|uuid|\bjwt\b|invalid signature/i,
    /\n\s+at\s|\.m?jsx?:\d+|node_modules|[{}<>`]/,
];

const ALLOWED_PATTERNS = [
    /^Your Stripe Express account is not complete yet\./,
];

export function isTechnicalErrorText(text) {
    if (typeof text !== 'string') return false;
    const value = text.trim();
    if (!value) return false;
    if (ALLOWED_PATTERNS.some((pattern) => pattern.test(value))) return false;
    if (value.length > 300) return true;
    return TECHNICAL_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizeErrorMessage(text, fallback = GENERIC_ERROR_MESSAGE) {
    if (typeof text !== 'string') return fallback;
    const value = text.replace(/^(Error|Exception):\s*/, '').trim();
    if (!value || isTechnicalErrorText(value)) return fallback;
    return value;
}

/** Friendly message for any caught error (axios error, Error, string). */
export function userFacingError(error, fallback = GENERIC_ERROR_MESSAGE) {
    if (!error) return fallback;
    if (typeof error === 'string') return sanitizeErrorMessage(error, fallback);
    const data = error.response?.data;
    const serverMessage = typeof data?.message === 'string' ? data.message
        : typeof data?.error === 'string' ? data.error
            : null;
    if (serverMessage) return sanitizeErrorMessage(serverMessage, fallback);
    if (error.code === 'ECONNABORTED' || /timeout/i.test(error.message || '')) return TIMEOUT_ERROR_MESSAGE;
    if (error.isAxiosError && !error.response) return NETWORK_ERROR_MESSAGE;
    return sanitizeErrorMessage(error.message, fallback);
}

/**
 * Rewrites an axios error in place so every existing
 * `err.response?.data?.message || err.message` in the app reads a safe text.
 */
export function sanitizeAxiosError(error) {
    if (!error || typeof error !== 'object') return error;
    const friendly = userFacingError(error);
    const data = error.response?.data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        if (typeof data.message === 'string' || typeof data.error === 'string' || data.message === undefined) {
            data.message = friendly;
        }
        if (typeof data.error === 'string') data.error = friendly;
        else if (data.error && typeof data.error === 'object') delete data.error;
        delete data.stack;
    } else if (error.response && typeof data === 'string') {
        // HTML error pages from the host / proxy.
        error.response.data = { success: false, message: friendly };
    }
    try {
        error.message = friendly;
    } catch {
        /* read-only message on exotic errors — the response data is still clean */
    }
    return error;
}
