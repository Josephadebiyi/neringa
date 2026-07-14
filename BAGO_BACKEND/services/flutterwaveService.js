import axios from 'axios';
import crypto from 'node:crypto';

const FLUTTERWAVE_SECRET_KEY = (process.env.FLUTTERWAVE_SECRET_KEY || '').trim();
// Not configurable via env — Flutterwave uses this exact base URL for both
// test and live modes (sandbox vs. live is determined by which kind of
// secret key you use, not the host), so a FLUTTERWAVE_BASE_URL env var only
// creates a way to misconfigure this. A previous env value missing the
// '/v3' suffix caused every request here to 404 against Flutterwave.
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';
const FLUTTERWAVE_WEBHOOK_SECRET_HASH = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH;

export const isFlutterwaveConfigured = () => Boolean(FLUTTERWAVE_SECRET_KEY);

function client() {
  if (!FLUTTERWAVE_SECRET_KEY) {
    throw new Error('Flutterwave secret key not configured');
  }
  return axios.create({
    baseURL: FLUTTERWAVE_BASE_URL,
    headers: {
      Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: 20000,
  });
}

/**
 * Initialize a Flutterwave Standard hosted checkout session.
 * Docs: POST /v3/payments
 */
export async function initializePayment({ txRef, amount, currency, redirectUrl, customerEmail, customerName, customerPhone, meta = {} }) {
  try {
    const response = await client().post('/payments', {
      tx_ref: txRef,
      amount,
      currency,
      redirect_url: redirectUrl,
      customer: {
        email: customerEmail,
        name: customerName,
        phonenumber: customerPhone,
      },
      meta,
    });
    if (response.data?.status === 'success' && response.data?.data?.link) {
      return { success: true, authorizationUrl: response.data.data.link, reference: txRef };
    }
    return { success: false, message: response.data?.message || 'Could not start Flutterwave checkout.' };
  } catch (error) {
    console.error('❌ Flutterwave initialize error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message || 'Payment initialization failed' };
  }
}

/**
 * Verify a transaction by its Flutterwave transaction_id.
 * Docs: GET /v3/transactions/:id/verify
 */
export async function verifyTransaction(transactionId) {
  try {
    const response = await client().get(`/transactions/${transactionId}/verify`);
    const data = response.data?.data;
    if (response.data?.status === 'success' && data && ['successful', 'success'].includes(String(data.status).toLowerCase())) {
      return {
        success: true,
        data: {
          id: data.id,
          txRef: data.tx_ref,
          amount: Number(data.amount || 0),
          currency: data.currency,
          status: data.status,
          customer: data.customer,
          chargedAmount: Number(data.charged_amount || data.amount || 0),
        },
      };
    }
    return { success: false, message: response.data?.message || 'Transaction was not successful.', data };
  } catch (error) {
    console.error('❌ Flutterwave verify error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message || 'Verification request failed' };
  }
}

/**
 * Refund a transaction (full or partial). Docs: POST /v3/transactions/:id/refund
 * Takes Flutterwave's numeric transaction_id, not tx_ref.
 */
export async function refundTransaction(transactionId, { amount, comments } = {}) {
  try {
    const response = await client().post(`/transactions/${transactionId}/refund`, {
      ...(amount != null ? { amount } : {}),
      ...(comments ? { comments } : {}),
    });
    const data = response.data?.data;
    if (response.data?.status === 'success' && data) {
      return { success: true, status: data.status, id: data.id, amountRefunded: data.amount_refunded };
    }
    return { success: false, message: response.data?.message || 'Refund could not be initiated.' };
  } catch (error) {
    console.error('❌ Flutterwave refund error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message || 'Refund request failed' };
  }
}

/**
 * List banks for a country (used by the African-currency bank-list picker).
 * Docs: GET /v3/banks/:country_code
 */
export async function getBanks(countryCode) {
  try {
    const response = await client().get(`/banks/${countryCode}`);
    const banks = Array.isArray(response.data?.data) ? response.data.data : [];
    return { success: true, banks: banks.map((b) => ({ code: b.code, name: b.name })) };
  } catch (error) {
    console.error(
      '❌ Flutterwave banks error:',
      `url=${FLUTTERWAVE_BASE_URL}/banks/${countryCode}`,
      `status=${error.response?.status}`,
      error.response?.data || error.message,
    );
    return { success: false, message: error.response?.data?.message || error.message, banks: [] };
  }
}

/**
 * Resolve an account number to an account name. Flutterwave's public docs
 * confirm this is Nigerian-banks-only — do not surface a "verified name"
 * badge for other corridors since nothing is actually being verified.
 */
export async function resolveAccount({ accountNumber, accountBank }) {
  try {
    const response = await client().post('/accounts/resolve', {
      account_number: accountNumber,
      account_bank: accountBank,
    });
    if (response.data?.status === 'success') {
      return { success: true, accountName: response.data?.data?.account_name || '' };
    }
    return { success: false, message: response.data?.message || 'Could not resolve account.' };
  } catch (error) {
    console.error('❌ Flutterwave resolve error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

// ── EUR/GBP orchestrated transfer flow ──────────────────────────────────────
// Flutterwave's flat POST /v3/transfers (below) only covers African bank
// corridors. EUR, GBP, EGP, and INR require the newer 3-step orchestrator:
// create a Transfer Recipient, create a Transfer Sender (EUR/GBP/EGP/INR
// only), then initiate the transfer referencing both ids. Confirmed from
// Flutterwave's own docs (general-transfer-flow guide + llms.txt endpoint
// index) — NOT confirmed against a real sandbox call yet:
//   - the exact `type` value for EUR/GBP recipients (using 'bank_eur' /
//     'bank_gbp' by analogy with the confirmed 'bank_ngn' / 'bank_egp'
//     pattern Flutterwave uses elsewhere)
//   - whether IBAN goes in bank.account_number (no separate iban field was
//     shown in any example we could retrieve) and SWIFT/BIC in bank.code
// Test a real recipient-creation call in Flutterwave's sandbox before
// trusting this for a live EUR/GBP transfer — if the type or field names
// are wrong, Flutterwave's error response will now surface directly to the
// caller (see catch blocks below) rather than being swallowed, so it should
// be fast to correct.

function transferRecipientType(currency) {
  const upper = String(currency || '').toUpperCase();
  if (upper === 'EUR') return 'bank_eur';
  if (upper === 'GBP') return 'bank_gbp';
  return `bank_${upper.toLowerCase()}`;
}

/**
 * Create a Transfer Recipient — required once per beneficiary before an
 * orchestrated (EUR/GBP) transfer can be initiated. The id is stored and
 * reused on every future withdrawal, not re-created each time.
 * Docs: POST /v3/transfers/recipients
 */
export async function createTransferRecipient({
  currency, iban, swiftBic, bankName, accountHolderFirstName, accountHolderMiddleName, accountHolderLastName,
  email, phoneCountryCode, phoneNumber, addressLine1, addressLine2, city, state, postalCode, country,
}) {
  try {
    const payload = {
      type: transferRecipientType(currency),
      bank: {
        name: bankName,
        account_number: iban,
        code: swiftBic,
      },
      name: {
        first: accountHolderFirstName,
        ...(accountHolderMiddleName ? { middle: accountHolderMiddleName } : {}),
        last: accountHolderLastName,
      },
      email,
      phone: { country_code: phoneCountryCode, number: phoneNumber },
      address: {
        line1: addressLine1,
        ...(addressLine2 ? { line2: addressLine2 } : {}),
        city,
        state,
        postal_code: postalCode,
        country,
      },
    };
    const response = await client().post('/transfers/recipients', payload);
    const data = response.data?.data;
    if (response.data?.status === 'success' && data?.id) {
      return { success: true, recipientId: data.id };
    }
    return { success: false, message: response.data?.message || 'Could not create transfer recipient.' };
  } catch (error) {
    console.error('❌ Flutterwave create-recipient error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message || 'Create recipient request failed' };
  }
}

/**
 * Create a Transfer Sender — required for EUR/GBP/EGP/INR transfers only.
 * The id is stored on the beneficiary record and reused on every future
 * withdrawal for that user, not re-created each time.
 * Docs: POST /v3/transfers/senders
 */
export async function createTransferSender({
  currency, firstName, middleName, lastName, email, phoneCountryCode, phoneNumber,
  addressLine1, addressLine2, city, state, postalCode, country, dateOfBirth,
  nationalIdType, nationalIdNumber,
}) {
  try {
    const payload = {
      type: transferRecipientType(currency),
      name: {
        first: firstName,
        ...(middleName ? { middle: middleName } : {}),
        last: lastName,
      },
      email,
      phone: { country_code: phoneCountryCode, number: phoneNumber },
      address: {
        line1: addressLine1,
        ...(addressLine2 ? { line2: addressLine2 } : {}),
        city,
        state,
        postal_code: postalCode,
        country,
      },
      date_of_birth: dateOfBirth,
      ...(nationalIdType && nationalIdNumber
        ? { national_identification: { type: nationalIdType, identifier: nationalIdNumber } }
        : {}),
    };
    const response = await client().post('/transfers/senders', payload);
    const data = response.data?.data;
    if (response.data?.status === 'success' && data?.id) {
      return { success: true, senderId: data.id };
    }
    return { success: false, message: response.data?.message || 'Could not create transfer sender.' };
  } catch (error) {
    console.error('❌ Flutterwave create-sender error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message || 'Create sender request failed' };
  }
}

/**
 * Initiate a transfer via the orchestrated flow (EUR/GBP/EGP/INR), using an
 * already-created recipient (and sender, for these currencies) id, rather
 * than the flat account_bank/account_number shape used for African
 * corridors. Docs: POST /v3/transfers (payment_instruction variant).
 */
export async function initiateOrchestratedTransfer({ recipientId, senderId, amount, sourceCurrency, narration, reference }) {
  try {
    const payload = {
      action: 'instant',
      reference,
      narration: narration || 'Bago traveler payout',
      payment_instruction: {
        source_currency: sourceCurrency,
        amount: { applies_to: 'source_currency', value: amount },
        recipient_id: recipientId,
        ...(senderId ? { sender_id: senderId } : {}),
      },
    };
    const response = await client().post('/transfers', payload);
    const data = response.data?.data;
    if (response.data?.status === 'success' && data) {
      return {
        success: true,
        transferId: data.id,
        status: data.status || 'NEW', // NEW | PENDING | SUCCESSFUL | FAILED
        reference: data.reference || reference,
      };
    }
    return { success: false, message: response.data?.message || 'Transfer could not be initiated.' };
  } catch (error) {
    console.error('❌ Flutterwave orchestrated transfer error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message || 'Transfer request failed' };
  }
}

/**
 * Initiate a payout transfer. Bank-corridor and IBAN-corridor callers both
 * pass account_number (IBAN for EUR/GBP), differing only in accountBank
 * (bank code) vs swiftCode being set.
 * Docs: POST /v3/transfers
 */
export async function initiateTransfer({ accountBank, accountNumber, swiftCode, amount, currency, narration, reference, debitCurrency, beneficiaryName }) {
  try {
    const payload = {
      account_bank: accountBank || undefined,
      account_number: accountNumber,
      amount,
      currency,
      narration: narration || 'Bago traveler payout',
      reference,
      debit_currency: debitCurrency || currency,
    };
    if (swiftCode) payload.swift_code = swiftCode;
    if (beneficiaryName) payload.beneficiary_name = beneficiaryName;

    const response = await client().post('/transfers', payload);
    const data = response.data?.data;
    if (response.data?.status === 'success' && data) {
      return {
        success: true,
        transferId: data.id,
        status: data.status, // NEW | SUCCESSFUL | FAILED
        reference: data.reference || reference,
        fee: Number(data.fee || 0),
      };
    }
    return { success: false, message: response.data?.message || 'Transfer could not be initiated.' };
  } catch (error) {
    console.error('❌ Flutterwave transfer error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message || 'Transfer request failed' };
  }
}

/**
 * Poll a transfer's current status — used by admin "Sync Flutterwave" and by
 * the withdrawal reconciliation path if a webhook is delayed/lost.
 * Docs: GET /v3/transfers/:id
 */
export async function getTransferStatus(transferId) {
  try {
    const response = await client().get(`/transfers/${transferId}`);
    const data = response.data?.data;
    if (response.data?.status === 'success' && data) {
      return { success: true, status: data.status, reference: data.reference };
    }
    return { success: false, message: response.data?.message || 'Could not fetch transfer status.' };
  } catch (error) {
    console.error('❌ Flutterwave transfer status error:', error.response?.data || error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

/**
 * Flutterwave webhooks carry a static shared-secret in the 'verif-hash'
 * header (not an HMAC of the body like Paystack) — a plain constant-time
 * string comparison against FLUTTERWAVE_WEBHOOK_SECRET_HASH is correct here.
 */
export function verifyWebhookSignature(headerHash) {
  if (!FLUTTERWAVE_WEBHOOK_SECRET_HASH || !headerHash) return false;
  const expected = Buffer.from(FLUTTERWAVE_WEBHOOK_SECRET_HASH);
  const actual = Buffer.from(String(headerHash));
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}
