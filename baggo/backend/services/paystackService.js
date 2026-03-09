/**
 * Paystack Service
 * Handles payments and payouts for African users (Nigeria, Ghana, Kenya, South Africa)
 */

import axios from 'axios';
import crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Initialize a payment transaction
 * @param {Object} params - Payment parameters
 * @returns {Promise<Object>} - Authorization URL and reference
 */
export async function initializePayment({ email, amount, currency = 'NGN', reference, metadata = {} }) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    // Amount must be in kobo (for NGN) or pesewa (for GHS) - smallest currency unit
    const amountInKobo = Math.round(amount * 100);

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amountInKobo,
        currency,
        reference,
        metadata,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      };
    }

    throw new Error(response.data.message || 'Payment initialization failed');
  } catch (error) {
    console.error('❌ Paystack initialization error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify a payment transaction
 * @param {String} reference - Transaction reference
 * @returns {Promise<Object>} - Transaction details
 */
export async function verifyPayment(reference) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status && response.data.data.status === 'success') {
      return {
        success: true,
        data: {
          reference: response.data.data.reference,
          amount: response.data.data.amount / 100, // Convert from kobo to naira
          currency: response.data.data.currency,
          paidAt: response.data.data.paid_at,
          channel: response.data.data.channel,
          customer: response.data.data.customer,
          metadata: response.data.data.metadata,
        },
      };
    }

    return {
      success: false,
      message: response.data.message || 'Payment verification failed',
    };
  } catch (error) {
    console.error('❌ Paystack verification error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a transfer recipient (for payouts)
 * @param {Object} params - Recipient details
 * @returns {Promise<Object>} - Recipient code
 */
export async function createTransferRecipient({ type = 'nuban', name, accountNumber, bankCode, currency = 'NGN' }) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transferrecipient`,
      {
        type, // 'nuban' for Nigerian banks, 'mobile_money' for Ghana, 'mpesa' for Kenya
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        recipientCode: response.data.data.recipient_code,
        details: response.data.data,
      };
    }

    throw new Error(response.data.message || 'Failed to create recipient');
  } catch (error) {
    console.error('❌ Paystack create recipient error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Initiate a transfer (payout)
 * @param {Object} params - Transfer parameters
 * @returns {Promise<Object>} - Transfer details
 */
export async function initiateTransfer({ amount, recipientCode, currency = 'NGN', reason = 'Bago payout', reference }) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    // Amount must be in kobo
    const amountInKobo = Math.round(amount * 100);

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transfer`,
      {
        source: 'balance',
        amount: amountInKobo,
        recipient: recipientCode,
        currency,
        reason,
        reference,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        transferCode: response.data.data.transfer_code,
        reference: response.data.data.reference,
        status: response.data.data.status,
        amount: response.data.data.amount / 100,
      };
    }

    throw new Error(response.data.message || 'Transfer failed');
  } catch (error) {
    console.error('❌ Paystack transfer error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify transfer status
 * @param {String} reference - Transfer reference
 * @returns {Promise<Object>} - Transfer status
 */
export async function verifyTransfer(reference) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transfer/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        status: response.data.data.status,
        amount: response.data.data.amount / 100,
        currency: response.data.data.currency,
        reason: response.data.data.reason,
        transferredAt: response.data.data.transferred_at,
      };
    }

    return {
      success: false,
      message: response.data.message || 'Transfer verification failed',
    };
  } catch (error) {
    console.error('❌ Paystack verify transfer error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get list of supported banks
 * @param {String} country - Country code (NG, GH, ZA, KE)
 * @param {String} currency - Currency code
 * @returns {Promise<Array>} - List of banks
 */
export async function getBankList(country = 'NG', currency = 'NGN') {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/bank?country=${country}&currency=${currency}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        banks: response.data.data.map(bank => ({
          name: bank.name,
          code: bank.code,
          slug: bank.slug,
          type: bank.type,
        })),
      };
    }

    throw new Error('Failed to fetch bank list');
  } catch (error) {
    console.error('❌ Paystack get banks error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Resolve account number to get account name
 * @param {String} accountNumber - Account number
 * @param {String} bankCode - Bank code
 * @returns {Promise<Object>} - Account details
 */
export async function resolveAccountNumber(accountNumber, bankCode) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    if (response.data.status) {
      return {
        success: true,
        accountNumber: response.data.data.account_number,
        accountName: response.data.data.account_name,
        bankId: response.data.data.bank_id,
      };
    }

    throw new Error(response.data.message || 'Account resolution failed');
  } catch (error) {
    console.error('❌ Paystack resolve account error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify Paystack webhook signature
 * @param {String} signature - X-Paystack-Signature header
 * @param {Object} body - Request body
 * @returns {Boolean} - Whether signature is valid
 */
export function verifyWebhookSignature(signature, body) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured');
    }

    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(body))
      .digest('hex');

    return hash === signature;
  } catch (error) {
    console.error('❌ Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Get supported countries for Paystack
 * @returns {Array} - List of supported countries
 */
export function getSupportedCountries() {
  return [
    { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦' },
    { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: 'GH₵' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R' },
    { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh' },
  ];
}

/**
 * Check if country is supported by Paystack
 * @param {String} countryCode - ISO country code
 * @returns {Boolean}
 */
export function isPaystackSupportedCountry(countryCode) {
  const supported = ['NG', 'GH', 'ZA', 'KE'];
  return supported.includes(countryCode?.toUpperCase());
}
