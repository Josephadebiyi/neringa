// Decides whether an error message is safe to show to an app user.
//
// Users should see plain, Bago-branded messages ("Insufficient balance.",
// "This trip is full."), never text that came from a payment/KYC provider,
// the database, the network layer or a JavaScript exception
// ("Please enable IP Whitelisting to access this service", "relation
// \"profiles\" does not exist", "Cannot read properties of undefined", ...).
// Those reveal internals, mean nothing to the user and look broken.

const TECHNICAL_PATTERNS = [
  // Third-party providers — users should only ever see Bago branding.
  /flutterwave|\bflw\b|stripe|paystack|prembly|dojah|mycover|resend|cloudinary|supabase|firebase|twilio|onrender|\brender\b|axios|node-fetch/i,
  // Provider account / infrastructure configuration.
  /white-?list|ip address|api[ -]?key|secret key|public key|encryption key|authorization key|bearer|merchant|access control|not configured|not enabled for (this|your) account|\bsandbox\b|test mode|live mode|webhook/i,
  /\bIP\b/,
  // Environment variable names (FLUTTERWAVE_SECRET_KEY, JWT_SECRET, ...).
  /\b[A-Z][A-Z0-9]+_[A-Z0-9_]+\b/,
  /process\.env|\.env\b/i,
  // Network / transport failures.
  /ECONN(REFUSED|RESET|ABORTED)|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|socket hang up|getaddrinfo|fetch failed|network error|timeout of \d+ms|request failed with status code|status code \d{3}|\b(bad gateway|gateway timeout|service unavailable|internal server error)\b/i,
  // JavaScript runtime errors.
  /cannot read propert|cannot set propert|is not a function|is not defined|is not iterable|undefined|\bnull\b|\[object Object\]|\b(Type|Reference|Syntax|Range)Error\b|unexpected token|unexpected end of json|json\.parse|stack trace/i,
  // Database errors.
  /\brelation "|\bcolumn "|violates (unique|foreign key|not-null|check) constraint|duplicate key|syntax error at|invalid input syntax|invalid input value for enum|null value in column|deadlock|connection terminated|too many clients|could not connect to server|\bpg_|\bsql\b|\bquery\b.*\bfailed\b|uuid/i,
  // Auth token internals.
  /\bjwt\b|invalid signature|jsonwebtoken|token (malformed|expired at)/i,
  // Code-looking content: stack frames, file paths, JSON, template syntax.
  /\n\s+at\s|\.m?js:\d+|node_modules|\/home\/|\/app\/|[{}<>`]|\$\{/,
];

// Deliberate, actionable messages that must name a provider because the user
// has to go there themselves (e.g. finish Stripe Express onboarding).
const ALLOWED_PATTERNS = [
  /^Your Stripe Express account is not complete yet\./,
];

export const DEFAULT_CLIENT_ERROR = 'Something went wrong. Please try again.';

const CONTEXT_FALLBACKS = [
  {
    match: /withdraw|payout/i,
    message: "We couldn't process your withdrawal right now. Your balance has not been affected. Please try again later.",
  },
  {
    match: /bank|beneficiar/i,
    message: "We couldn't verify these bank details right now. Please check them and try again.",
  },
  {
    match: /payment|checkout|flutterwave|stripe|paystack|bizum|refund|wallet/i,
    message: "We couldn't complete this payment right now. Please try again. If you were charged, contact support.",
  },
  {
    match: /kyc|prembly|dojah|verif|identity/i,
    message: "We couldn't complete verification right now. Please try again shortly.",
  },
  {
    match: /insurance/i,
    message: "We couldn't update your insurance right now. Please try again or contact support.",
  },
  {
    match: /signin|sign-in|login|signup|sign-up|register|auth|password|otp/i,
    message: "We couldn't complete that request right now. Please try again.",
  },
];

/** A user-friendly fallback message suited to the endpoint that failed. */
export function fallbackMessageForPath(path = '') {
  const hit = CONTEXT_FALLBACKS.find(({ match }) => match.test(path));
  return hit ? hit.message : DEFAULT_CLIENT_ERROR;
}

/** True when `text` looks technical or provider-specific and must not reach a user. */
export function isTechnicalMessage(text) {
  if (typeof text !== 'string') return false;
  const value = text.trim();
  if (!value) return false;
  if (ALLOWED_PATTERNS.some((pattern) => pattern.test(value))) return false;
  if (value.length > 300) return true;
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(value));
}

/** Returns `text` when it's safe for users, otherwise `fallback`. */
export function safeClientMessage(text, fallback = DEFAULT_CLIENT_ERROR) {
  if (typeof text !== 'string' || !text.trim()) return fallback;
  return isTechnicalMessage(text) ? fallback : text;
}

const MESSAGE_KEYS = ['message', 'error', 'msg', 'detail', 'details', 'reason'];
const ALWAYS_STRIP_KEYS = ['stack', 'raw', 'providerResponse', 'providerError', 'provider_response'];

/**
 * Returns a copy of an error response body with every technical message
 * replaced by a friendly one. `onReplace` receives the original text so the
 * caller can log it — the real error must never be lost, just not shown.
 */
export function sanitizeClientErrorPayload(payload, { path = '', onReplace } = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const fallback = fallbackMessageForPath(path);
  const clean = { ...payload };
  let replacedPrimary = false;

  for (const key of ALWAYS_STRIP_KEYS) delete clean[key];

  for (const key of MESSAGE_KEYS) {
    const value = clean[key];
    if (typeof value === 'string') {
      if (isTechnicalMessage(value)) {
        onReplace?.(key, value);
        if (key === 'message') {
          clean.message = fallback;
          replacedPrimary = true;
        } else {
          delete clean[key];
        }
      }
    } else if (value && typeof value === 'object' && key !== 'message') {
      // Raw provider/DB error objects (e.g. `error: err.response.data`).
      onReplace?.(key, JSON.stringify(value).slice(0, 500));
      delete clean[key];
    }
  }

  // Whatever key the app reads first, make sure it finds a friendly message.
  if (replacedPrimary === false && typeof clean.message !== 'string') {
    const removedAll = MESSAGE_KEYS.every((key) => clean[key] === undefined);
    if (removedAll && MESSAGE_KEYS.some((key) => payload[key] !== undefined)) {
      clean.message = fallback;
    }
  }
  return clean;
}
