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

    // Generate unique reference
    const reference = `BAGO-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const paymentMetadata = {
      userId: user.id,
      requestId,
      packageId: packageId || null,
      tripId: tripId || null,
      customerEmail: customerEmail || user.email || null,
      expiresAt: expiresAt || null,
      amount: Number(amount),
      currency: currency || user.preferredCurrency || 'NGN',
      ...metadata,
    };

    const result = await initializePayment({
      email: user.email,
      amount,
      currency: currency || user.preferredCurrency || 'NGN',
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
      ['paystack', 'payment_initialized', reference, requestId || null, paymentMetadata],
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
      `SELECT available_balance, paystack_recipient_code, kyc_status FROM public.profiles WHERE id = $1`,
      [user.id]
    );

    if (!profile || profile.kyc_status !== 'approved') {
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

    const result = await initiateTransfer({
      amount: withdrawalAmount,
      recipientCode: profile.paystack_recipient_code,
      reference,
      reason: 'Bago wallet withdrawal',
    });

    if (!result.success) {
      await pgQuery(
        `UPDATE public.profiles SET available_balance = available_balance + $2, updated_at = NOW() WHERE id = $1`,
        [user.id, withdrawalAmount],
      );
      return res.status(400).json({ success: false, message: result.message || 'Transfer failed' });
    }

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
      `SELECT user_id, amount, currency FROM public.wallet_transactions
       WHERE type = 'withdrawal' AND metadata->>'reference' = $1 LIMIT 1`,
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
      ]);
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
    }
    console.log(`❌ Transfer failed: ${reference} — ${failureReason}`);
  } catch (error) {
    console.error('Handle failed transfer error:', error);
  }
}

async function handleReversedTransfer(data) {
  try {
    const { reference } = data;
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
    }
    console.log(`🔄 Transfer reversed: ${reference}`);
  } catch (error) {
    console.error('Handle reversed transfer error:', error);
  }
}
