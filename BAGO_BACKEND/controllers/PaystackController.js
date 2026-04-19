import {
  initializePayment,
  verifyPayment,
  createTransferRecipient,
  initiateTransfer,
  verifyTransfer,
  getBankList,
  resolveAccountNumber,
  verifyWebhookSignature,
  getSupportedCountries,
} from '../services/paystackService.js';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';
import { convertCurrency } from '../services/currencyConverter.js';
import { Resend } from 'resend';

let resend = null;
try { resend = new Resend(process.env.RESEND_API_KEY); } catch (e) {}

/**
 * Initialize Paystack payment
 * POST /api/paystack/initialize
 */
export const initializePaystackPayment = async (req, res) => {
  try {
    const { amount, currency, requestId, metadata } = req.body;
    const user = req.user; // already a Postgres profile from isAuthenticated

    // Generate unique reference
    const reference = `BAGO-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const result = await initializePayment({
      email: user.email,
      amount,
      currency: currency || user.preferredCurrency || 'NGN',
      reference,
      metadata: {
        userId: user.id,
        requestId,
        ...metadata,
      },
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Initialize Paystack payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.message,
    });
  }
};

/**
 * Verify Paystack payment
 * GET /api/paystack/verify/:reference
 */
export const verifyPaystackPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const result = await verifyPayment(reference);

    if (result.success && result.data.metadata?.requestId) {
      const requestId = result.data.metadata.requestId;

      // Update request payment status in Postgres
      const updatedRequest = await queryOne(
        `UPDATE public.shipment_requests
         SET payment_method = 'paystack',
             payment_status = 'paid',
             payment_reference = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, traveler_id, trip_id, amount`,
        [requestId, reference]
      );

      if (updatedRequest) {
        // Add to traveler's escrow balance (wallet_accounts is the source of truth)
        await pgQuery(
          `UPDATE public.wallet_accounts
           SET escrow_balance = escrow_balance + $2,
               updated_at = NOW()
           WHERE user_id = $1`,
          [updatedRequest.traveler_id, updatedRequest.amount || 0]
        );
        console.log(`🔒 Escrowed ${updatedRequest.amount} for traveler via Paystack verify`);

      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Verify Paystack payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

/**
 * Add bank account for payouts
 * POST /api/paystack/add-bank
 */
export const addBankAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode, bankName } = req.body;
    const user = req.user;

    // Resolve account to verify
    const accountInfo = await resolveAccountNumber(accountNumber, bankCode);

    if (!accountInfo.success) {
      return res.status(400).json({
        success: false,
        message: 'Could not verify bank account. Please check the account number and bank.',
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store pending bank details + OTP inside bank_details JSON
    await pgQuery(
      `UPDATE public.profiles
       SET bank_details = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [
        user.id,
        JSON.stringify({
          accountNumber,
          bankCode,
          accountName: accountInfo.accountName,
          bankName: bankName || 'Bank',
          pendingOtp: otp,
          otpExpiresAt: expiresAt.toISOString(),
        }),
      ]
    );

    // Send OTP via email
    if (resend) {
      await resend.emails.send({
        from: 'Bago <noreply@bagoapp.com>',
        to: user.email,
        subject: 'Confirm Your Bank Account',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
            <h2 style="color:#5C4BFD">Confirm Bank Account</h2>
            <p>You are linking a new payout account to your Bago profile:</p>
            <p><strong>Bank:</strong> ${bankName || 'Bank'}</p>
            <p><strong>Account:</strong> ${accountInfo.accountName} — ****${accountNumber.slice(-4)}</p>
            <p>Use the code below to confirm. It expires in 10 minutes.</p>
            <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#5C4BFD;margin:24px 0">${otp}</div>
            <p style="color:#9CA3AF;font-size:12px">If you did not request this, please contact support immediately.</p>
          </div>
        `,
      });
    } else {
      console.log('Bank OTP (no email):', otp);
    }

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      accountName: accountInfo.accountName,
      message: `A 6-digit confirmation code has been sent to ${user.email}`,
    });
  } catch (error) {
    console.error('Add bank account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate bank account setup',
      error: error.message,
    });
  }
};

/**
 * POST /api/paystack/verify-bank-otp
 */
export const verifyBankOTP = async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.user.id;

    // Fetch pending bank info from Postgres
    const profile = await queryOne(
      `SELECT bank_details, preferred_currency
       FROM public.profiles WHERE id = $1`,
      [userId]
    );

    const bankDetails = typeof profile?.bank_details === 'string'
      ? JSON.parse(profile.bank_details)
      : profile?.bank_details || {};

    if (!profile || !bankDetails.pendingOtp) {
      return res.status(400).json({ success: false, message: 'No pending bank account. Please start over.' });
    }

    if (new Date() > new Date(bankDetails.otpExpiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please start over.' });
    }

    if (bankDetails.pendingOtp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    const { accountNumber, bankCode, accountName, bankName } = bankDetails;

    // Create transfer recipient on Paystack
    const result = await createTransferRecipient({
      name: accountName,
      accountNumber,
      bankCode,
      currency: profile.preferred_currency || 'NGN',
    });

    if (!result.success) {
      throw new Error('Failed to create Paystack recipient');
    }

    // Save recipient code and finalize bank details in Postgres
    await pgQuery(
      `UPDATE public.profiles
       SET paystack_recipient_code = $2,
           bank_details = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [
        userId,
        result.recipientCode,
        JSON.stringify({ bankName, accountNumber, accountHolderName: accountName }),
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Bank account linked successfully!',
      accountName,
    });
  } catch (error) {
    console.error('Verify bank OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message,
    });
  }
};

/**
 * Withdraw funds via Paystack transfer
 * POST /api/paystack/withdraw
 */
export const withdrawFundsPaystack = async (req, res) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const profile = await queryOne(
      `SELECT available_balance, paystack_recipient_code FROM public.profiles WHERE id = $1`,
      [user.id]
    );

    if (!profile || !profile.paystack_recipient_code) {
      return res.status(400).json({ success: false, message: 'No bank account linked. Please add a bank account first.' });
    }

    if ((profile.available_balance || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const reference = `BAGO-WD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    const result = await initiateTransfer({
      amount,
      recipient: profile.paystack_recipient_code,
      reference,
      reason: 'Bago wallet withdrawal',
    });

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message || 'Transfer failed' });
    }

    // Deduct from available balance
    await pgQuery(
      `UPDATE public.profiles
       SET available_balance = available_balance - $2, updated_at = NOW()
       WHERE id = $1`,
      [user.id, amount]
    );

    return res.status(200).json({
      success: true,
      message: 'Withdrawal initiated successfully',
      reference,
      data: result.data,
    });
  } catch (error) {
    console.error('Withdraw funds Paystack error:', error);
    return res.status(500).json({ success: false, message: 'Failed to initiate withdrawal', error: error.message });
  }
};

/**
 * Get list of banks
 * GET /api/paystack/banks?country=NG
 */
export const getPaystackBanks = async (req, res) => {
  try {
    let { country = 'NG', currency = 'NGN' } = req.query;
    country = Array.isArray(country) ? country[0] : country;
    currency = Array.isArray(currency) ? currency[0] : currency;

    const countryMap = {
      'nigeria': 'NG', 'ng': 'NG',
      'ghana': 'GH', 'gh': 'GH',
      'kenya': 'KE', 'ke': 'KE',
      'south africa': 'ZA', 'za': 'ZA',
    };

    const countryStr = String(country);
    const normalizedCountry =
      countryMap[countryStr.toLowerCase()] || countryStr.toUpperCase();

    const result = await getBankList(normalizedCountry, currency);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Get Paystack banks error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch banks',
    });
  }
};

/**
 * Resolve bank account
 * GET /api/paystack/resolve
 */
export const resolvePaystackAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.query;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: 'Account number and bank code are required',
      });
    }

    const result = await resolveAccountNumber(accountNumber, bankCode);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Resolve account error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve account',
      error: error.message,
    });
  }
};

/**
 * Get supported countries
 */
export const getPaystackCountries = async (req, res) => {
  try {
    const countries = getSupportedCountries();
    return res.status(200).json({ success: true, countries });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch countries', error: error.message });
  }
};

/**
 * Paystack Webhook Handler
 */
export const paystackWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    const body = req.body;

    if (!verifyWebhookSignature(signature, body)) {
      console.error('❌ Invalid Paystack webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const event = body.event;
    const data = body.data;

    console.log(`📥 Paystack Webhook: ${event}`);

    switch (event) {
      case 'charge.success':
        await handleSuccessfulPayment(data);
        break;
      case 'transfer.success':
        await handleSuccessfulTransfer(data);
        break;
      case 'transfer.failed':
        await handleFailedTransfer(data);
        break;
      case 'transfer.reversed':
        await handleReversedTransfer(data);
        break;
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Paystack webhook error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

async function handleSuccessfulPayment(data) {
  try {
    const { reference, amount, metadata } = data;

    if (metadata?.requestId) {
      const updatedRequest = await queryOne(
        `UPDATE public.shipment_requests
         SET payment_method = 'paystack',
             payment_status = 'paid',
             payment_reference = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING traveler_id, trip_id, amount`,
        [metadata.requestId, reference]
      );

      if (updatedRequest) {
        await pgQuery(
          `UPDATE public.wallet_accounts
           SET escrow_balance = escrow_balance + $2, updated_at = NOW()
           WHERE user_id = $1`,
          [updatedRequest.traveler_id, updatedRequest.amount || 0]
        );
        console.log(`🔒 Escrowed $${updatedRequest.amount} via Paystack webhook`);

      }

      console.log(`✅ Payment confirmed for request ${metadata.requestId}`);
    }
  } catch (error) {
    console.error('Handle successful payment error:', error);
  }
}

async function handleSuccessfulTransfer(data) {
  try {
    console.log(`✅ Transfer successful: ${data.reference}`);
  } catch (error) {
    console.error('Handle successful transfer error:', error);
  }
}

async function handleFailedTransfer(data) {
  try {
    console.log(`❌ Transfer failed: ${data.reference}`);
  } catch (error) {
    console.error('Handle failed transfer error:', error);
  }
}

async function handleReversedTransfer(data) {
  try {
    console.log(`🔄 Transfer reversed: ${data.reference}`);
  } catch (error) {
    console.error('Handle reversed transfer error:', error);
  }
}
