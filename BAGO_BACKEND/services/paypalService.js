const PAYPAL_LIVE_BASE_URL = 'https://api-m.paypal.com';
const PAYPAL_SANDBOX_BASE_URL = 'https://api-m.sandbox.paypal.com';

function baseUrl() {
  return process.env.PAYPAL_ENV === 'sandbox'
    ? PAYPAL_SANDBOX_BASE_URL
    : (process.env.PAYPAL_BASE_URL || PAYPAL_LIVE_BASE_URL);
}

export function getPaypalClientId() {
  return process.env.PAYPAL_CLIENT_ID || '';
}

export function isPaypalAdvancedCardsEnabled() {
  return process.env.PAYPAL_ADVANCED_CARDS_ENABLED === 'true';
}

export function isPaypalApplePayEnabled() {
  return process.env.PAYPAL_APPLE_PAY_ENABLED === 'true';
}

function requirePaypalCredentials() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const err = new Error('PayPal is not configured.');
    err.statusCode = 503;
    throw err;
  }
  return { clientId, clientSecret };
}

async function getAccessToken() {
  const { clientId, clientSecret } = requirePaypalCredentials();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    const err = new Error(data.error_description || data.message || 'PayPal authentication failed.');
    err.statusCode = response.status || 502;
    throw err;
  }
  return data.access_token;
}

export async function paypalRequest(path, { method = 'GET', body } = {}) {
  const accessToken = await getAccessToken();
  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || data.error_description || 'PayPal request failed.');
    err.statusCode = response.status || 502;
    err.details = data;
    throw err;
  }
  return data;
}

export async function createPaypalOrder({
  amount,
  currency,
  customId,
  description,
  returnUrl,
  cancelUrl,
}) {
  return paypalRequest('/v2/checkout/orders', {
    method: 'POST',
    body: {
      intent: 'AUTHORIZE',
      purchase_units: [
        {
          reference_id: customId,
          custom_id: customId,
          description,
          amount: {
            currency_code: String(currency || 'USD').toUpperCase(),
            value: Number(amount || 0).toFixed(2),
          },
        },
      ],
      application_context: {
        brand_name: 'Bago',
        landing_page: 'LOGIN',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    },
  });
}

export async function authorizePaypalOrder(orderId) {
  return paypalRequest(`/v2/checkout/orders/${encodeURIComponent(orderId)}/authorize`, {
    method: 'POST',
    body: {},
  });
}

export async function capturePaypalAuthorization(authorizationId) {
  return paypalRequest(`/v2/payments/authorizations/${encodeURIComponent(authorizationId)}/capture`, {
    method: 'POST',
    body: { final_capture: true },
  });
}

export async function voidPaypalAuthorization(authorizationId) {
  return paypalRequest(`/v2/payments/authorizations/${encodeURIComponent(authorizationId)}/void`, {
    method: 'POST',
    body: {},
  });
}
