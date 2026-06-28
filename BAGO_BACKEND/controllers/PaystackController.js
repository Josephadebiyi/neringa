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
import { sendPushNotification } from '../services/pushNotificationService.js';
import {
  createNotification,
  createShipmentRequestRecord,
  getPackageById,
  getShipmentRequestById,
  getTripById,
} from '../lib/postgres/shipping.js';
import { holdEscrowForPaidRequest } from '../lib/postgres/accounts.js';
import { mergePaidDuplicateRequest } from './postgresRequestController.js';
import { calculateAllInclusivePrice, getFullPricingConfig } from '../services/pricingService.js';
import { convertCurrency } from '../services/currencyConverter.js';
import { sendWithdrawalProcessedEmail, sendWithdrawalSubmittedEmail } from '../services/emailNotifications.js';
import { assertNoActiveWithdrawal } from '../services/withdrawalSafety.js';
import { Resend } from 'resend';
import crypto from 'crypto';

let resend = null;
try { resend = new Resend(process.env.RESEND_API_KEY); } catch (e) {}

function normalizeBankPayload(body = {}) {
  return {
    accountNumber: body.accountNumber || body.account_number || '',
    bankCode: body.bankCode || body.bank_code || '',
    bankName: body.bankName || body.bank_name || 'Bank',
  };
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function otpHashMatches(storedHash, otp) {
  const calculatedHash = hashOtp(otp);
  if (!storedHash || storedHash.length !== calculatedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(calculatedHash));
}

/**
 * Initialize Paystack payment
 * POST /api/paystack/initialize
 */
export const initializePaystackPayment = async (req, res) => {
  try {
    const { amount, currency, requestId, packageId, tripId, customerEmail, expiresAt, metadata } = req.body;
    const user = req.user; // already a Postgres profile from isAuthenticated
    const paymentCurrency = String(currency || user.preferredCurrency || 'NGN').toUpperCase();
    let chargeAmount = Number(amount);
    let pricingMetadata = {};

    if (packageId && tripId) {
      const [packageDoc, tripDoc, pricingConfig] = await Promise.all([
        getPackageById(packageId),
        getTripById(tripId),
        getFullPricingConfig(),
      ]);
      if (!packageDoc || packageDoc.userId !== user.id) {
        return res.status(404).json({ success: false, message: 'Package not found.' });
      }
      if (!tripDoc?.userId) {
        return res.status(404).json({ success: false, message: 'Trip not found.' });
      }

      const tripCurrency = String(tripDoc.currency || paymentCurrency).toUpperCase();
      const travelerPayout = Number(packageDoc.packageWeight || 0) * Number(tripDoc.pricePerKg || 0);
      const pricing = calculateAllInclusivePrice(travelerPayout, pricingConfig);
      const senderShippingFee = paymentCurrency === tripCurrency
        ? Number(pricing.senderShippingFee)
        : await convertCurrency(pricing.senderShippingFee, tripCurrency, paymentCurrency);
      const insuranceAccepted = parseBooleanFlag(metadata?.insurance);
      const itemValue = Number(packageDoc.packageValue || packageDoc.package_value || 0);
      const calculatedInsuranceCost = insuranceAccepted
        ? Number((itemValue * (Number(pricingConfig.senderInsurancePercent || 0) / 100)).toFixed(2))
        : 0;
      const finalInsuranceCost = calculatedInsuranceCost > 0
        ? calculatedInsuranceCost
        : (insuranceAccepted ? Number(metadata?.insuranceCost || 0) : 0);
      chargeAmount = Number((Number(senderShippingFee) + finalInsuranceCost).toFixed(2));
      pricingMetadata = {
        amount: chargeAmount,
        currency: paymentCurrency,
        insurance: insuranceAccepted,
        insuranceCost: finalInsuranceCost,
        travelerPayout: Number(pricing.travelerPayout || 0),
        platformCommission: Number(pricing.platformCommission || 0),
        processingFee: Number(pricing.processingFee || 0),
        fxBuffer: Number(pricing.fxBuffer || 0),
        senderShippingFee: Number(senderShippingFee || 0),
        bagoNetRevenue: Number(pricing.bagoNetRevenue || 0),
      };
    }

    // Generate unique reference
    const reference = `BAGO-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const paymentMetadata = {
      userId: user.id,
      requestId,
      packageId: packageId || null,
      tripId: tripId || null,
      customerEmail: customerEmail || user.email || null,
      expiresAt: expiresAt || null,
      ...metadata,
      amount: chargeAmount,
      currency: paymentCurrency,
      ...pricingMetadata,
    };

    const result = await initializePayment({
      email: user.email,
      amount: chargeAmount,
      currency: paymentCurrency,
      reference,
      metadata: paymentMetadata,
    });

    await pgQuery(
      `
        insert into public.payment_events (provider, event_type, provider_reference, request_id, payload)
        values ($1, $2, $3, $4, $5)
        on conflict (provider, event_type, provider_reference) do update
        set payload = excluded.payload
      `,
      [
        'paystack',
        'payment_initialized',
        reference,
        requestId || null,
        {
          ...paymentMetadata,
          authorizationUrl: result?.authorization_url || result?.data?.authorization_url || null,
          accessCode: result?.access_code || result?.data?.access_code || null,
        },
      ],
    ).catch((eventError) => {
      console.error('Failed to persist payment initialization event:', eventError);
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

    await pgQuery(
      `
        insert into public.payment_events (provider, event_type, provider_reference, request_id, payload)
        values ($1, $2, $3, $4, $5)
        on conflict (provider, event_type, provider_reference) do update
        set payload = excluded.payload
      `,
      ['paystack', 'payment_verified', reference, result.data?.metadata?.requestId || null, result.data || {}],
    ).catch((eventError) => {
      console.error('Failed to persist payment verification event:', eventError);
    });

    if (result.success && result.data.metadata?.requestId) {
      const requestId = result.data.metadata.requestId;

      const updatedRequest = await queryOne(
        `UPDATE public.shipment_requests
         SET payment_info = $2,
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, traveler_id, trip_id, amount, currency`,
        [requestId, { method: 'paystack', status: 'paid', gateway: 'paystack', requestId: reference }]
      );

      if (updatedRequest) {
        await holdEscrowForPaidRequest({
          requestId: updatedRequest.id,
          providerReference: reference,
          provider: 'paystack',
        });
        console.log(`🔒 Paystack payment verified and ledger/escrow recorded for request ${updatedRequest.id}`);
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
    const { accountNumber, bankCode, bankName } = normalizeBankPayload(req.body);
    const user = req.user;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: 'Account number and bank are required.',
      });
    }

    // Resolve account to verify
    const accountInfo = await resolveAccountNumber(accountNumber, bankCode);

    if (!accountInfo.success) {
      return res.status(400).json({
        success: false,
        message: 'Could not verify bank account. Please check the account number and bank.',
      });
    }

    const currency = (req.body?.currency || req.body?.walletCurrency || req.body?.preferredCurrency || user.preferred_currency || 'NGN').toString().toUpperCase();
    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await pgQuery(
      `UPDATE public.profiles
       SET bank_details = $2,
           payout_provider = 'paystack',
           payout_method = 'paystack',
           payout_method_status = 'otp_pending',
           updated_at = NOW()
       WHERE id = $1`,
      [
        user.id,
        JSON.stringify({
          bankName: bankName || 'Bank',
          bankCode,
          accountNumber,
          accountName: accountInfo.accountName,
          currency,
          pendingOtpHash: hashOtp(otp),
          otpExpiresAt: expiresAt.toISOString(),
        }),
      ]
    );

    if (!resend || !resend.emails?.send) {
      return res.status(503).json({
        success: false,
        requiresOtp: true,
        message: 'Bank confirmation code could not be sent because email service is not configured. Please contact support.',
      });
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'Bago <no-reply@sendwithbago.com>',
      to: user.email,
      subject: 'Confirm your Bago payout bank',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:32px;color:#111827">
          <h2 style="color:#5240E8;margin:0 0 18px">Confirm your payout bank</h2>
          <p>Hi ${user.first_name || 'there'},</p>
          <p>You are linking this bank account for Bago payouts:</p>
          <p><strong>Bank:</strong> ${bankName || 'Bank'}<br>
          <strong>Account:</strong> ${accountInfo.accountName} - ****${accountNumber.slice(-4)}</p>
          <p>Enter this 6-digit code in the app. It expires in 30 minutes.</p>
          <div style="font-size:36px;font-weight:900;letter-spacing:8px;color:#5240E8;margin:24px 0">${otp}</div>
          <p style="color:#6b7280;font-size:13px">If you did not request this, contact Bago support immediately.</p>
        </div>
      `,
    });
    if (emailError) {
      console.error('Bank OTP email send error:', emailError);
      return res.status(502).json({
        success: false,
        requiresOtp: true,
        message: 'Bank confirmation code could not be sent. Please try again or contact support.',
      });
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
    const otp = req.body?.otp?.toString().trim();
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

    if (!profile || (!bankDetails.pendingOtpHash && !bankDetails.pendingOtp)) {
      return res.status(400).json({ success: false, message: 'No pending bank account. Please start over.' });
    }

    if (new Date() > new Date(bankDetails.otpExpiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please start over.' });
    }

    const otpMatches = bankDetails.pendingOtpHash
      ? otpHashMatches(bankDetails.pendingOtpHash, otp)
      : bankDetails.pendingOtp === otp;

    if (!otpMatches) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

    const { accountNumber, bankCode, accountName, bankName, currency } = bankDetails;

    // Create transfer recipient on Paystack
    let result;
    try {
      result = await createTransferRecipient({
        name: accountName,
        accountNumber,
        bankCode,
        currency: currency || profile.preferred_currency || 'NGN',
      });
    } catch (recipientErr) {
      console.error('Paystack create recipient failed after OTP verify:', recipientErr?.response?.data || recipientErr.message);
      return res.status(422).json({
        success: false,
        message: 'Your OTP was correct, but we could not register your bank with our payment provider. Please try again or contact support.',
      });
    }

    if (!result.success) {
      return res.status(422).json({
        success: false,
        message: 'Your OTP was correct, but bank registration failed. Please try again.',
      });
    }

    // Save recipient code and finalize bank details in Postgres
    await pgQuery(
      `UPDATE public.profiles
       SET paystack_recipient_code = $2,
           bank_details = $3,
           payout_provider = 'paystack',
           payout_method = 'paystack',
           payout_method_status = 'connected',
           updated_at = NOW()
       WHERE id = $1`,
      [
        userId,
        result.recipientCode,
        JSON.stringify({ bankName, bankCode, accountNumber, accountName, accountHolderName: accountName, recipientCode: result.recipientCode, paystackRecipientStatus: 'active' }),
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

    const withdrawalAmount = Number(amount);
    if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const profile = await queryOne(
      `SELECT available_balance, paystack_recipient_code, kyc_status, email, first_name, last_name FROM public.profiles WHERE id = $1`,
      [user.id]
    );

    const kycStatus = String(profile?.kyc_status || '').trim().toLowerCase();
    const hasPassedKyc = ['approved', 'verified', 'completed'].includes(kycStatus);
    if (!profile || !hasPassedKyc) {
      return res.status(403).json({
        success: false,
        code: 'KYC_REQUIRED',
        message: 'Identity verification is required before withdrawing funds. Please complete KYC in your profile.',
      });
    }

    if (!profile || !profile.paystack_recipient_code) {
      return res.status(400).json({ success: false, message: 'No bank account linked. Please add a bank account first.' });
    }

    if ((profile.available_balance || 0) < withdrawalAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    await assertNoActiveWithdrawal(null, user.id);

    const reference = `BAGO-WD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const debit = await queryOne(
      `UPDATE public.profiles
       SET available_balance = available_balance - $2, updated_at = NOW()
       WHERE id = $1 AND available_balance >= $2
       RETURNING available_balance`,
      [user.id, withdrawalAmount],
    );
    if (!debit) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    let result;
    try {
      result = await initiateTransfer({
        amount: withdrawalAmount,
        recipientCode: profile.paystack_recipient_code,
        reference,
        reason: 'Bago wallet withdrawal',
      });
    } catch (transferError) {
      await pgQuery(
        `UPDATE public.profiles SET available_balance = available_balance + $2, updated_at = NOW() WHERE id = $1`,
        [user.id, withdrawalAmount],
      ).catch((refundError) => {
        console.error('Paystack withdrawal refund after transfer error failed:', refundError);
      });
      return res.status(transferError.statusCode || 502).json({
        success: false,
        code: transferError.code || 'PAYSTACK_TRANSFER_FAILED',
        message: transferError.message || 'Paystack transfer failed',
        providerStatus: transferError.providerStatus || null,
        providerData: transferError.providerData || null,
      });
    }

    if (!result.success) {
      await pgQuery(
        `UPDATE public.profiles SET available_balance = available_balance + $2, updated_at = NOW() WHERE id = $1`,
        [user.id, withdrawalAmount],
      );
      return res.status(400).json({ success: false, message: result.message || 'Transfer failed' });
    }

    // Track the pending withdrawal so webhook handlers can restore balance on async failure
    await pgQuery(
      `INSERT INTO public.paystack_pending_withdrawals (user_id, reference, amount, currency)
       VALUES ($1, $2, $3, $4) ON CONFLICT (reference) DO NOTHING`,
      [user.id, reference, withdrawalAmount, 'NGN'],
    ).catch(() => {}); // non-fatal: balance was already debited successfully
    await sendWithdrawalSubmittedEmail(
      profile.email || user.email,
      [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim(),
      {
        amount: withdrawalAmount,
        currency: 'NGN',
        reference,
        method: 'bank account',
      },
    ).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Withdrawal initiated successfully',
      reference,
      data: result.data,
    });
  } catch (error) {
    console.error('Withdraw funds Paystack error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code,
      message: error.message || 'Failed to initiate withdrawal',
      error: error.message,
    });
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

/**
 * Paystack Transfer Approval URL
 * Paystack calls this before sending a transfer when transfer approvals are enabled.
 * We approve only Bago-created pending withdrawal references.
 */
export const paystackTransferApproval = async (req, res) => {
  try {
    const body = req.body || {};
    const data = body.data || body;
    const reference = String(
      data.reference ||
      data.transfer_reference ||
      data.transferReference ||
      body.reference ||
      '',
    ).trim();

    if (!reference) {
      console.warn('Paystack transfer approval missing reference:', JSON.stringify(body).slice(0, 500));
      return res.status(200).json({
        status: false,
        approved: false,
        message: 'Missing transfer reference',
      });
    }

    const pending = await queryOne(
      `SELECT reference
       FROM public.paystack_pending_withdrawals
       WHERE reference = $1 AND status = 'pending'
       LIMIT 1`,
      [reference],
    );

    const walletTx = pending ? null : await queryOne(
      `SELECT id
       FROM public.wallet_transactions
       WHERE type = 'withdrawal'
         AND metadata->>'reference' = $1
         AND status IN ('processing', 'pending_admin_approval')
       LIMIT 1`,
      [reference],
    );

    const approved = Boolean(pending || walletTx);
    console.log(`Paystack transfer approval ${approved ? 'approved' : 'rejected'}: ${reference}`);

    return res.status(200).json({
      status: approved,
      approved,
      approve: approved,
      message: approved ? 'Transfer approved' : 'Unknown or non-pending Bago withdrawal',
    });
  } catch (error) {
    console.error('Paystack transfer approval error:', error);
    return res.status(200).json({
      status: false,
      approved: false,
      message: 'Transfer approval failed',
    });
  }
};

async function handleSuccessfulPayment(data) {
  const { reference, metadata } = data;

  if (!metadata?.requestId) {
    await finalizePaystackShipmentFromMetadata(data);
    return;
  }

  const updatedRequest = await queryOne(
    `UPDATE public.shipment_requests
     SET payment_info = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, sender_id, traveler_id, trip_id, amount, currency, tracking_number`,
    [metadata.requestId, { method: 'paystack', status: 'paid', gateway: 'paystack', requestId: reference }]
  );

  if (!updatedRequest) {
    console.log(`ℹ️ No request found for requestId ${metadata.requestId} — will be handled by RequestPackage`);
    return;
  }

  await holdEscrowForPaidRequest({
    requestId: updatedRequest.id,
    providerReference: reference,
    provider: 'paystack',
  });

  // Fetch names for notification messages
  const [sender, traveler] = await Promise.all([
    queryOne(`SELECT first_name, last_name FROM public.profiles WHERE id = $1`, [updatedRequest.sender_id]),
    queryOne(`SELECT first_name, last_name FROM public.profiles WHERE id = $1`, [updatedRequest.traveler_id]),
  ]);
  const senderName = sender ? `${sender.first_name || ''} ${sender.last_name || ''}`.trim() : 'Sender';
  const travelerName = traveler ? `${traveler.first_name || ''} ${traveler.last_name || ''}`.trim() : 'Traveler';
  const tracking = updatedRequest.tracking_number || '';

  // Notify sender: payment confirmed
  await Promise.allSettled([
    createNotification({
      userId: updatedRequest.sender_id,
      title: 'Payment confirmed!',
      body: `Your payment was received. ${travelerName} will carry your package. Tracking: ${tracking}`,
      type: 'payment_confirmed',
      payload: { requestId: updatedRequest.id },
    }),
    sendPushNotification(
      updatedRequest.sender_id,
      'Payment confirmed!',
      `Your payment was received. ${travelerName} will carry your package.`,
      { requestId: updatedRequest.id, type: 'payment_confirmed' }
    ),
    // Notify traveler: new booking paid
    createNotification({
      userId: updatedRequest.traveler_id,
      title: 'New booking received!',
      body: `${senderName} has paid for a shipment on your trip. Check your incoming requests.`,
      type: 'shipment_request',
      payload: { requestId: updatedRequest.id },
    }),
    sendPushNotification(
      updatedRequest.traveler_id,
      'New booking received!',
      `${senderName} has paid for a shipment on your trip.`,
      { requestId: updatedRequest.id, type: 'shipment_request' }
    ),
  ]);

  console.log(`✅ Payment confirmed & notifications sent for request ${metadata.requestId}`);
}

async function finalizePaystackShipmentFromMetadata(data) {
  const { reference, metadata = {} } = data || {};
  const senderId = metadata.userId;
  const packageId = metadata.packageId;
  const tripId = metadata.tripId;

  if (!reference || !senderId || !packageId || !tripId) {
    return null;
  }

  const packageDoc = await getPackageById(packageId);
  if (!packageDoc || packageDoc.userId !== senderId) {
    return null;
  }

  const tripDoc = await getTripById(tripId);
  if (!tripDoc?.userId) {
    return null;
  }

  const existingRequest = await queryOne(
    `
      select id
      from public.shipment_requests
      where sender_id = $1
        and traveler_id = $2
        and package_id = $3
        and trip_id = $4
        and payment_info ->> 'requestId' = $5
      order by created_at desc
      limit 1
    `,
    [senderId, tripDoc.userId, packageId, tripId, reference],
  );

  const amount = Number(data?.amount || 0) / 100 || Number(metadata.amount || 0);
  const currency = String(data?.currency || metadata.currency || 'NGN').toUpperCase();
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  const duplicateRequest = existingRequest
    ? null
    : await queryOne(
        `
          select sr.id
          from public.shipment_requests sr
          where sr.sender_id = $1
            and sr.traveler_id = $2
            and sr.trip_id = $3
            and sr.status in ('pending', 'accepted')
            and coalesce(sr.payment_info ->> 'requestId', '') <> $4
            and not exists (
              select 1
              from jsonb_array_elements(coalesce(sr.payment_info -> 'payments', '[]'::jsonb)) payment
              where payment ->> 'requestId' = $4
            )
          order by sr.created_at desc
          limit 1
        `,
        [senderId, tripDoc.userId, tripId, reference],
      );

  const request = existingRequest
    ? await getShipmentRequestById(existingRequest.id)
    : duplicateRequest
      ? await mergePaidDuplicateRequest({
          requestId: duplicateRequest.id,
          senderId,
          incomingPackageId: packageId,
          additionalAmount: amount,
          currency,
          paymentReference: reference,
          paymentProvider: 'paystack',
          insurance: metadata.insurance,
          insuranceCost: metadata.insuranceCost,
        })
    : await createShipmentRequestRecord({
        senderId,
        travelerId: tripDoc.userId,
        packageId,
        tripId,
        amount,
        currency,
        imageUrl: null,
        insurance: parseBooleanFlag(metadata.insurance),
        insuranceCost: Number(metadata.insuranceCost || 0),
        travelerPayout: Number(metadata.travelerPayout || 0) || null,
        platformCommission: Number(metadata.platformCommission || 0) || null,
        processingFee: Number(metadata.processingFee || 0) || null,
        fxBuffer: Number(metadata.fxBuffer || 0) || null,
        senderShippingFee: Number(metadata.senderShippingFee || 0) || null,
        bagoNetRevenue: Number(metadata.bagoNetRevenue || 0) || null,
        estimatedDeparture: metadata.estimatedDeparture
          ? new Date(metadata.estimatedDeparture)
          : (tripDoc.departureDate ? new Date(tripDoc.departureDate) : null),
        estimatedArrival: metadata.estimatedArrival
          ? new Date(metadata.estimatedArrival)
          : (tripDoc.arrivalDate ? new Date(tripDoc.arrivalDate) : null),
        termsAccepted: true,
        paymentInfo: {
          method: 'paystack',
          gateway: 'paystack',
          status: 'paid',
          requestId: reference,
        },
      });

  if (!duplicateRequest) {
    await holdEscrowForPaidRequest({
      requestId: request.id,
      providerReference: reference,
      provider: 'paystack',
    });
  }

  // Mark the package as matched so it no longer shows as a draft
  await pgQuery(
    `update public.packages set status = 'matched', updated_at = timezone('utc', now()) where id = $1 and status = 'draft'`,
    [packageId],
  ).catch(() => {});

  await Promise.allSettled([
    createNotification({
      userId: request.travelerId,
      title: duplicateRequest ? 'Shipment request updated' : 'New booking received!',
      body: duplicateRequest
        ? `${request.senderName || 'A sender'} added extra kg to an existing request on your trip.`
        : `${request.senderName || 'A sender'} has paid for a shipment on your trip.`,
      type: 'shipment_request',
      payload: { requestId: request.id, tripId, merged: Boolean(duplicateRequest) },
    }),
    sendPushNotification(
      request.travelerId,
      duplicateRequest ? 'Shipment request updated' : 'New booking received!',
      duplicateRequest
        ? `${request.senderName || 'A sender'} added extra kg to an existing request.`
        : `${request.senderName || 'A sender'} has paid for a shipment on your trip.`,
      { requestId: request.id, type: 'shipment_request', merged: Boolean(duplicateRequest) },
    ),
  ]);

  return request;
}

function parseBooleanFlag(value) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === '1';
}

async function handleSuccessfulTransfer(data) {
  try {
    const { reference } = data;
    // Find the wallet transaction by reference stored in metadata
    const tx = await queryOne(
      `SELECT wt.user_id, wt.amount, wt.currency, p.email, p.first_name, p.last_name
       FROM public.wallet_transactions wt
       LEFT JOIN public.profiles p ON p.id = wt.user_id
       WHERE wt.type = 'withdrawal' AND wt.metadata->>'reference' = $1 LIMIT 1`,
      [reference]
    );
    if (tx) {
      await pgQuery(
        `UPDATE public.wallet_transactions SET status = 'completed' WHERE type = 'withdrawal' AND metadata->>'reference' = $1`,
        [reference]
      );
      const displayAmount = `${tx.currency} ${Number(tx.amount).toFixed(2)}`;
      await Promise.allSettled([
        createNotification({
          userId: tx.user_id,
          title: 'Withdrawal successful!',
          body: `Your withdrawal of ${displayAmount} is on its way. Funds arrive within 1–3 business days.`,
          type: 'withdrawal_success',
          payload: { reference },
        }),
        sendPushNotification(
          tx.user_id,
          'Withdrawal successful!',
          `Your withdrawal of ${displayAmount} is on its way to your bank.`,
          { type: 'withdrawal_success', reference }
        ),
        sendWithdrawalProcessedEmail(
          tx.email,
          [tx.first_name, tx.last_name].filter(Boolean).join(' ').trim(),
          { amount: tx.amount, currency: tx.currency, reference, method: 'bank account' },
        ),
      ]);
    } else {
      const ppw = await queryOne(
        `UPDATE public.paystack_pending_withdrawals ppw
         SET status = 'completed', updated_at = NOW()
         FROM public.profiles p
         WHERE ppw.user_id = p.id
           AND ppw.reference = $1
           AND ppw.status = 'pending'
         RETURNING ppw.user_id, ppw.amount, ppw.currency, p.email, p.first_name, p.last_name`,
        [reference],
      );
      if (ppw) {
        const displayAmount = `${ppw.currency} ${Number(ppw.amount).toFixed(2)}`;
        await Promise.allSettled([
          createNotification({
            userId: ppw.user_id,
            title: 'Withdrawal successful!',
            body: `Your withdrawal of ${displayAmount} has been processed.`,
            type: 'withdrawal_success',
            payload: { reference },
          }),
          sendPushNotification(
            ppw.user_id,
            'Withdrawal successful!',
            `Your withdrawal of ${displayAmount} has been processed.`,
            { type: 'withdrawal_success', reference },
          ),
          sendWithdrawalProcessedEmail(
            ppw.email,
            [ppw.first_name, ppw.last_name].filter(Boolean).join(' ').trim(),
            { amount: ppw.amount, currency: ppw.currency, reference, method: 'bank account' },
          ),
        ]);
      }
    }
    console.log(`✅ Transfer successful: ${reference}`);
  } catch (error) {
    console.error('Handle successful transfer error:', error);
  }
}

async function handleFailedTransfer(data) {
  try {
    const { reference, gateway_response, reason } = data;
    const failureReason = gateway_response || reason || 'Transfer declined';

    const userFaultPattern = /invalid account|account not found|invalid recipient|recipient not found|account number|no such account|dormant account/i;
    const isUserFault = userFaultPattern.test(failureReason);

    // Stripe/non-Paystack withdrawal path: wallet_transactions record exists
    const tx = await queryOne(
      `SELECT user_id, amount, currency FROM public.wallet_transactions
       WHERE type = 'withdrawal' AND metadata->>'reference' = $1 LIMIT 1`,
      [reference]
    );
    if (tx) {
      await pgQuery(
        `UPDATE public.wallet_accounts SET available_balance = available_balance + $2, updated_at = NOW() WHERE user_id = $1`,
        [tx.user_id, tx.amount]
      );
      await pgQuery(
        `UPDATE public.wallet_transactions
         SET status = 'failed',
             metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{failure_reason}', $2::jsonb)
         WHERE type = 'withdrawal' AND metadata->>'reference' = $1`,
        [reference, JSON.stringify(failureReason)]
      );
      const displayAmount = `${tx.currency} ${Number(tx.amount).toFixed(2)}`;
      const userMessage = isUserFault
        ? `Your withdrawal of ${displayAmount} failed — your bank account details may be incorrect. Please update your payout account and try again. Your balance has been restored.`
        : `Your withdrawal of ${displayAmount} could not be processed. Your balance has been restored. Please contact support if this continues.`;
      await Promise.allSettled([
        createNotification({
          userId: tx.user_id,
          title: 'Withdrawal failed',
          body: userMessage,
          type: 'withdrawal_failed',
          payload: { reference, isUserFault },
        }),
        sendPushNotification(
          tx.user_id,
          'Withdrawal failed',
          userMessage,
          { type: 'withdrawal_failed', reference, isUserFault }
        ),
      ]);
    } else {
      // Paystack (African currency) withdrawal path: balance lives in profiles
      const ppw = await queryOne(
        `UPDATE public.paystack_pending_withdrawals
         SET status = 'failed', updated_at = NOW()
         WHERE reference = $1 AND status = 'pending'
         RETURNING user_id, amount, currency`,
        [reference]
      );
      if (ppw) {
        await pgQuery(
          `UPDATE public.profiles SET available_balance = available_balance + $2, updated_at = NOW() WHERE id = $1`,
          [ppw.user_id, ppw.amount]
        );
        const displayAmount = `${ppw.currency} ${Number(ppw.amount).toFixed(2)}`;
        const userMessage = isUserFault
          ? `Your withdrawal of ${displayAmount} failed — your bank account details may be incorrect. Please update your payout account and try again. Your balance has been restored.`
          : `Your withdrawal of ${displayAmount} could not be processed. Your balance has been restored. Please contact support if this continues.`;
        await Promise.allSettled([
          createNotification({
            userId: ppw.user_id,
            title: 'Withdrawal failed',
            body: userMessage,
            type: 'withdrawal_failed',
            payload: { reference, isUserFault },
          }),
          sendPushNotification(
            ppw.user_id,
            'Withdrawal failed',
            userMessage,
            { type: 'withdrawal_failed', reference, isUserFault }
          ),
        ]);
      }
    }
    console.log(`❌ Transfer failed: ${reference} — ${failureReason}`);
  } catch (error) {
    console.error('Handle failed transfer error:', error);
  }
}

async function handleReversedTransfer(data) {
  try {
    const { reference } = data;

    // Stripe/non-Paystack withdrawal path
    const tx = await queryOne(
      `SELECT user_id, amount, currency FROM public.wallet_transactions
       WHERE type = 'withdrawal' AND metadata->>'reference' = $1 LIMIT 1`,
      [reference]
    );
    if (tx) {
      await pgQuery(
        `UPDATE public.wallet_accounts SET available_balance = available_balance + $2, updated_at = NOW() WHERE user_id = $1`,
        [tx.user_id, tx.amount]
      );
      await pgQuery(
        `UPDATE public.wallet_transactions SET status = 'failed' WHERE type = 'withdrawal' AND metadata->>'reference' = $1`,
        [reference]
      );
      const displayAmount = `${tx.currency} ${Number(tx.amount).toFixed(2)}`;
      await Promise.allSettled([
        createNotification({
          userId: tx.user_id,
          title: 'Withdrawal reversed',
          body: `Your withdrawal of ${displayAmount} was reversed by your bank. Your balance has been restored.`,
          type: 'withdrawal_failed',
          payload: { reference },
        }),
        sendPushNotification(
          tx.user_id,
          'Withdrawal reversed',
          `Your withdrawal of ${displayAmount} was reversed. Your balance has been restored.`,
          { type: 'withdrawal_failed', reference }
        ),
      ]);
    } else {
      // Paystack (African currency) withdrawal path
      const ppw = await queryOne(
        `UPDATE public.paystack_pending_withdrawals
         SET status = 'failed', updated_at = NOW()
         WHERE reference = $1 AND status = 'pending'
         RETURNING user_id, amount, currency`,
        [reference]
      );
      if (ppw) {
        await pgQuery(
          `UPDATE public.profiles SET available_balance = available_balance + $2, updated_at = NOW() WHERE id = $1`,
          [ppw.user_id, ppw.amount]
        );
        const displayAmount = `${ppw.currency} ${Number(ppw.amount).toFixed(2)}`;
        await Promise.allSettled([
          createNotification({
            userId: ppw.user_id,
            title: 'Withdrawal reversed',
            body: `Your withdrawal of ${displayAmount} was reversed by your bank. Your balance has been restored.`,
            type: 'withdrawal_failed',
            payload: { reference },
          }),
          sendPushNotification(
            ppw.user_id,
            'Withdrawal reversed',
            `Your withdrawal of ${displayAmount} was reversed. Your balance has been restored.`,
            { type: 'withdrawal_failed', reference }
          ),
        ]);
      }
    }
    console.log(`🔄 Transfer reversed: ${reference}`);
  } catch (error) {
    console.error('Handle reversed transfer error:', error);
  }
}
