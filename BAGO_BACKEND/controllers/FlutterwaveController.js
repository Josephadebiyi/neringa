import crypto from 'crypto';
import {
  isFlutterwaveConfigured,
  initializePayment,
  verifyTransaction,
  getBanks,
  resolveAccount,
  initiateTransfer,
  initiateOrchestratedTransfer,
  createTransferRecipient,
  createTransferSender,
  verifyWebhookSignature,
} from '../services/flutterwaveService.js';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';
import {
  recordPaymentInitiated,
  markPaymentVerified,
  saveBeneficiary,
  getActiveBeneficiary,
} from '../lib/postgres/flutterwavePayments.js';
import { CurrencyService } from '../services/currencyConverter.js';
import { generateOtpEmailHtml, sendWithdrawalSubmittedEmail } from '../services/emailNotifications.js';
import { resend } from '../services/resendClient.js';
import { assertNoActiveWithdrawal } from '../services/withdrawalSafety.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sendwithbago.com';
const PAYOUT_ACCOUNT_OTP_MINUTES = 10;

function hashPayoutOtp(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function payoutOtpMatches(storedHash, value) {
  const calculated = hashPayoutOtp(value);
  if (!storedHash || storedHash.length !== calculated.length) return false;
  return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(calculated));
}

function maskEmail(email = '') {
  const [local = '', domain = ''] = String(email).split('@');
  return domain ? `${local.slice(0, 2)}***@${domain}` : 'your email';
}

async function ensurePayoutAccountOtpColumns() {
  await pgQuery(`
    alter table public.profiles
      add column if not exists payout_account_otp_hash text,
      add column if not exists payout_account_otp_expires_at timestamptz,
      add column if not exists pending_payout_account jsonb
  `);
}

// Currencies that require Flutterwave's orchestrated transfer flow (Transfer
// Recipient + Transfer Sender + payment_instruction transfer) instead of the
// flat account_bank/account_number call used for African bank corridors.
const ORCHESTRATED_TRANSFER_CURRENCIES = new Set(['EUR']);
const SUPPORTED_BANK_PAYOUT_CURRENCIES = new Set([
  'EUR', 'GBP', 'KES', 'NGN', 'ZAR',
]);

// Minimal calling-code lookup for splitting a stored "+<code><number>" phone
// string into Flutterwave's separate country_code/number fields. Not a full
// phone-number library — covers the countries BAGO actually operates in.
const CALLING_CODES = {
  NG: '234', GH: '233', KE: '254', ZA: '27', US: '1', CA: '1', GB: '44',
  DE: '49', FR: '33', ES: '34', IT: '39', NL: '31', BE: '32', IE: '353',
  PT: '351', AT: '43', LT: '370',
};

function splitPhone(phone, countryIso) {
  const raw = String(phone || '').replace(/[^\d+]/g, '');
  const digitsOnly = raw.replace(/^\+/, '');
  const guessedCode = CALLING_CODES[String(countryIso || '').toUpperCase()];
  if (guessedCode && digitsOnly.startsWith(guessedCode)) {
    return { countryCode: guessedCode, number: digitsOnly.slice(guessedCode.length) };
  }
  if (guessedCode) {
    return { countryCode: guessedCode, number: digitsOnly };
  }
  // No known calling code for this country — best effort: assume the first
  // 1-3 digits are the code, matching common calling-code lengths.
  return { countryCode: digitsOnly.slice(0, 2), number: digitsOnly.slice(2) };
}

function requireConfigured(res) {
  if (!isFlutterwaveConfigured()) {
    res.status(503).json({ success: false, message: 'Payments are temporarily unavailable. Please try again shortly.' });
    return false;
  }
  return true;
}

// ── Payment collection ──────────────────────────────────────────────────────

export const initializeFlutterwavePayment = async (req, res, next) => {
  try {
    if (!requireConfigured(res)) return;
    const { amount, currency, packageId, tripId, requestId, additionalKg, metadata = {}, platform } = req.body || {};
    const user = req.user;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'A valid amount is required.' });
    }
    const normalizedCurrency = CurrencyService.normalizeCurrency(currency || 'USD');

    const txRef = `BAGO-PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    // Mobile opens checkout in a real Safari/Chrome-Custom-Tabs context (not an
    // embedded webview) so Apple Pay actually works — Flutterwave/Apple both
    // document that Apple Pay does not function inside a plain WKWebView.
    // redirectUrl is chosen server-side from a fixed pair, never trusting a
    // client-supplied URL (open-redirect risk).
    const redirectUrl = platform === 'mobile'
      ? 'com.deracali.boltexponativewind.payments://callback'
      : `${FRONTEND_URL}/payment/callback`;

    const init = await initializePayment({
      txRef,
      amount: numericAmount,
      currency: normalizedCurrency,
      redirectUrl,
      customerEmail: user.email,
      customerName: [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email,
      customerPhone: user.phone,
      meta: { packageId, tripId, requestId, additionalKg, userId: user.id, ...metadata },
    });

    if (!init.success) {
      return res.status(502).json({ success: false, message: init.message || 'Could not start checkout.' });
    }

    await recordPaymentInitiated({
      provider: 'flutterwave',
      providerReference: txRef,
      userId: user.id,
      amount: numericAmount,
      currency: normalizedCurrency,
      rawResponse: { packageId, tripId, requestId, additionalKg },
    }).catch((e) => console.warn('Failed to record payment_intent:', e.message));

    return res.status(200).json({
      success: true,
      authorizationUrl: init.authorizationUrl,
      reference: txRef,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Server-side verification, reused both by the HTTP endpoint below and by
 * postgresRequestController.js's booking-paid verification branch — the
 * booking must never be trusted from the client redirect alone.
 */
export async function verifyFlutterwaveTransactionServerSide(transactionReference) {
  if (!isFlutterwaveConfigured()) {
    return { success: false, message: 'Payments are temporarily unavailable.' };
  }
  // Flutterwave's verify endpoint takes the numeric transaction_id (returned in the
  // webhook/redirect), not our tx_ref — the frontend passes transaction_id through.
  const verification = await verifyTransaction(transactionReference);
  if (!verification.success) {
    return { success: false, message: verification.message || 'Payment could not be verified.' };
  }
  await markPaymentVerified({
    provider: 'flutterwave',
    providerReference: verification.data.txRef || transactionReference,
    status: 'verified',
    rawResponse: verification.data,
  }).catch((e) => console.warn('Failed to mark payment verified:', e.message));
  return { success: true, data: verification.data };
}

export const verifyFlutterwavePayment = async (req, res, next) => {
  try {
    if (!requireConfigured(res)) return;
    const { txId } = req.params;
    const result = await verifyFlutterwaveTransactionServerSide(txId);
    if (!result.success) {
      return res.status(402).json({ success: false, message: result.message });
    }
    return res.status(200).json({
      success: true,
      status: 'success',
      reference: result.data.txRef,
      amount: result.data.amount,
      currency: result.data.currency,
    });
  } catch (error) {
    next(error);
  }
};

export const flutterwaveWebhook = async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];
    if (!verifyWebhookSignature(signature)) {
      return res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body || {};
    const eventType = event.event || event['event.type'] || 'unknown';
    const txRef = event.data?.tx_ref;
    const transactionId = event.data?.id;

    // Idempotent upsert into the same payment_events table Paystack/PayPal use.
    await pgQuery(
      `
        insert into public.payment_events (provider, event_type, provider_reference, payload)
        values ('flutterwave', $1, $2, $3::jsonb)
        on conflict (provider, event_type, provider_reference) do update
          set payload = excluded.payload, updated_at = timezone('utc', now())
      `,
      [eventType, String(txRef || transactionId || 'unknown'), JSON.stringify(event)],
    ).catch((e) => console.warn('Flutterwave webhook event log failed:', e.message));

    if (eventType === 'charge.completed' && event.data?.status === 'successful' && transactionId) {
      await verifyFlutterwaveTransactionServerSide(transactionId).catch((e) =>
        console.warn('Flutterwave webhook verification follow-up failed:', e.message),
      );
    }

    if (eventType === 'transfer.completed' && event.data?.reference) {
      const status = String(event.data.status || '').toLowerCase();
      await pgQuery(
        `
          update public.wallet_transactions
          set status = $2, updated_at = timezone('utc', now())
          where metadata->>'reference' = $1 and type = 'withdrawal' and status not in ('completed','failed')
        `,
        [event.data.reference, status === 'successful' ? 'completed' : 'failed'],
      ).catch((e) => console.warn('Flutterwave transfer webhook update failed:', e.message));
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Flutterwave webhook error:', error);
    return res.status(200).json({ success: false }); // ack anyway to stop retries storming
  }
};

// ── Payouts ──────────────────────────────────────────────────────────────

export const getFlutterwaveBanks = async (req, res, next) => {
  try {
    if (!requireConfigured(res)) return;
    const country = String(req.query.country || 'NG').toUpperCase();
    const result = await getBanks(country);
    if (!result.success) {
      return res.status(502).json({
        success: false,
        banks: [],
        message: result.message || 'Could not fetch banks from the payout provider.',
      });
    }
    return res.status(200).json({ success: true, banks: result.banks });
  } catch (error) {
    next(error);
  }
};

export const resolveFlutterwaveAccount = async (req, res, next) => {
  try {
    if (!requireConfigured(res)) return;
    const { accountNumber, bankCode } = req.query;
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ success: false, message: 'accountNumber and bankCode are required.' });
    }
    const result = await resolveAccount({ accountNumber, accountBank: bankCode });
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.status(200).json({ success: true, accountName: result.accountName });
  } catch (error) {
    next(error);
  }
};

export const connectFlutterwaveBeneficiary = async (req, res, next) => {
  try {
    if (!requireConfigured(res)) return;
    const user = req.user;
    const {
      accountNumber, bankCode, bankName, accountHolderName, iban, swiftBic, currency,
      addressLine1, addressLine2, city, state, postalCode, addressCountry,
    } = req.body || {};
    const normalizedCurrency = CurrencyService.normalizeCurrency(currency || 'USD');
    if (!SUPPORTED_BANK_PAYOUT_CURRENCIES.has(normalizedCurrency)) {
      return res.status(400).json({
        success: false,
        message: `${normalizedCurrency} is not supported for bank payouts.`,
      });
    }
    const isIban = Boolean(iban);
    const needsOrchestration = ORCHESTRATED_TRANSFER_CURRENCIES.has(normalizedCurrency);

    if (isIban) {
      if (!accountHolderName || !iban || !swiftBic) {
        return res.status(400).json({ success: false, message: 'Account holder name, IBAN, and SWIFT/BIC are required.' });
      }
      if (needsOrchestration && (!addressLine1 || !city || !postalCode || !addressCountry)) {
        return res.status(400).json({ success: false, message: 'Address (street, city, postal code, and country) is required for this currency.' });
      }
    } else if (!accountNumber || !bankCode) {
      return res.status(400).json({ success: false, message: 'Select a bank and enter your account number.' });
    }

    // Never replace a payout destination solely from an authenticated session.
    // Email possession must be confirmed first; the pending details expire with
    // the OTP and are only submitted to Flutterwave after successful verification.
    if (!req.payoutAccountOtpVerified) {
      if (!resend) {
        return res.status(503).json({ success: false, message: 'Email verification is temporarily unavailable.' });
      }
      await ensurePayoutAccountOtpColumns();
      const profile = await queryOne(
        `select email, first_name from public.profiles where id = $1`,
        [user.id],
      );
      if (!profile?.email) {
        return res.status(400).json({ success: false, message: 'Add a verified email before setting a payout account.' });
      }
      const otp = String(crypto.randomInt(100000, 1000000));
      await pgQuery(
        `update public.profiles
         set payout_account_otp_hash = $2,
             payout_account_otp_expires_at = timezone('utc', now()) + ($3::int * interval '1 minute'),
             pending_payout_account = $4::jsonb,
             updated_at = timezone('utc', now())
         where id = $1`,
        [user.id, hashPayoutOtp(otp), PAYOUT_ACCOUNT_OTP_MINUTES, JSON.stringify(req.body || {})],
      );
      const { error: emailError } = await resend.emails.send({
        from: process.env.WITHDRAWAL_OTP_FROM || 'Bago <no-reply@sendwithbago.com>',
        to: profile.email,
        subject: 'Confirm your Bago payout account',
        html: generateOtpEmailHtml({
          firstName: profile.first_name || 'there',
          otp,
          subtitle: 'Use this code to confirm your new payout account.',
          expiryNote: `This code expires in ${PAYOUT_ACCOUNT_OTP_MINUTES} minutes.`,
        }),
      });
      if (emailError) {
        return res.status(502).json({ success: false, message: 'Could not send the confirmation code. Please try again.' });
      }
      return res.status(202).json({
        success: true,
        requiresOtp: true,
        message: `Confirmation code sent to ${maskEmail(profile.email)}.`,
        expiresInMinutes: PAYOUT_ACCOUNT_OTP_MINUTES,
      });
    }

    let flutterwaveRecipientId = null;
    let flutterwaveSenderId = null;

    if (isIban && needsOrchestration) {
      const profile = await queryOne(
        `select first_name, last_name, email, phone, date_of_birth, country from public.profiles where id = $1`,
        [user.id],
      );
      const { countryCode: phoneCountryCode, number: phoneNumber } = splitPhone(profile?.phone, profile?.country);
      const [first, ...lastParts] = accountHolderName.trim().split(/\s+/);
      const last = lastParts.length ? lastParts.join(' ') : (profile?.last_name || first);

      const recipientResult = await createTransferRecipient({
        currency: normalizedCurrency,
        iban,
        swiftBic,
        bankName,
        accountHolderFirstName: first || profile?.first_name,
        accountHolderLastName: last,
        email: profile?.email,
        phoneCountryCode,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country: addressCountry,
      });
      if (!recipientResult.success) {
        return res.status(502).json({ success: false, message: recipientResult.message || 'Could not register payout recipient with Flutterwave.' });
      }
      flutterwaveRecipientId = recipientResult.recipientId;

      const senderResult = await createTransferSender({
        currency: normalizedCurrency,
        firstName: profile?.first_name || first,
        lastName: profile?.last_name || last,
        email: profile?.email,
        phoneCountryCode,
        phoneNumber,
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
        country: addressCountry,
        dateOfBirth: profile?.date_of_birth
          ? new Date(profile.date_of_birth).toISOString().slice(0, 10)
          : undefined,
      });
      if (!senderResult.success) {
        return res.status(502).json({ success: false, message: senderResult.message || 'Could not register payout sender with Flutterwave.' });
      }
      flutterwaveSenderId = senderResult.senderId;
    }

    const beneficiary = await saveBeneficiary({
      userId: user.id,
      currency: normalizedCurrency,
      country: req.body.country || null,
      type: isIban ? 'iban' : 'bank',
      accountHolderName,
      accountNumber,
      bankCode,
      bankName,
      iban,
      swiftCode: swiftBic,
      flutterwaveRecipientId,
      flutterwaveSenderId,
    });

    await pgQuery(
      `
        update public.profiles
        set payout_provider = 'flutterwave',
            payout_method = 'flutterwave',
            payout_status = 'active',
            payout_method_status = 'connected',
            payout_currency = $2,
            bank_details = jsonb_build_object('bankName', $3::text, 'accountNumber', $4::text, 'accountHolderName', $5::text),
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [user.id, normalizedCurrency, bankName || null, accountNumber || iban || null, accountHolderName || null],
    );
    if (req.payoutAccountOtpVerified) {
      await pgQuery(
        `update public.profiles
         set payout_account_otp_hash = null, payout_account_otp_expires_at = null,
             pending_payout_account = null, updated_at = timezone('utc', now())
         where id = $1`,
        [user.id],
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Bank account linked!',
      requiresOtp: false,
      accountName: accountHolderName || '',
      beneficiaryId: beneficiary?.id,
      maskedDisplay: beneficiary?.masked_display,
    });
  } catch (error) {
    next(error);
  }
};

// Complete the pending beneficiary only after possession of the account email
// has been proved with the short-lived OTP created by the connect endpoint.
export const verifyFlutterwaveBankOtp = async (req, res) => {
  try {
    const otp = String(req.body?.otp || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: 'Enter the 6-digit confirmation code.' });
    }
    await ensurePayoutAccountOtpColumns();
    const profile = await queryOne(
      `select payout_account_otp_hash, payout_account_otp_expires_at, pending_payout_account
       from public.profiles where id = $1`,
      [req.user.id],
    );
    const expiresAt = profile?.payout_account_otp_expires_at
      ? new Date(profile.payout_account_otp_expires_at)
      : null;
    if (!profile?.pending_payout_account || !expiresAt || expiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'Confirmation code expired. Submit the account again.' });
    }
    if (!payoutOtpMatches(profile.payout_account_otp_hash, otp)) {
      return res.status(400).json({ success: false, message: 'Invalid confirmation code.' });
    }

    req.body = profile.pending_payout_account;
    req.payoutAccountOtpVerified = true;
    return connectFlutterwaveBeneficiary(req, res, (error) => {
      if (error && !res.headersSent) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
      }
    });
  } catch (error) {
    console.error('verifyFlutterwaveBankOtp error:', error);
    return res.status(500).json({ success: false, message: 'Could not verify the payout account.' });
  }
};

export const withdrawFundsFlutterwave = async (req, res) => {
  try {
    if (!isFlutterwaveConfigured()) {
      return res.status(503).json({ success: false, message: 'Withdrawals are temporarily unavailable. Please try again shortly.' });
    }
    const { amount, currency } = req.body;
    const user = req.user;

    const withdrawalAmount = Number(amount);
    if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }

    const profile = await queryOne(
      `SELECT p.kyc_status, p.email, p.first_name, p.last_name,
              wa.id as wallet_id, wa.available_balance, wa.currency
       FROM public.profiles p
       JOIN public.wallet_accounts wa on wa.user_id = p.id
       WHERE p.id = $1`,
      [user.id],
    );
    const walletCurrency = CurrencyService.normalizeCurrency(profile?.currency || currency || 'USD');
    const requestedCurrency = currency ? CurrencyService.normalizeCurrency(currency) : walletCurrency;
    if (requestedCurrency !== walletCurrency) {
      return res.status(400).json({ success: false, message: `Withdraw in your wallet currency (${walletCurrency}).` });
    }

    const kycStatus = String(profile?.kyc_status || '').trim().toLowerCase();
    const hasPassedKyc = ['approved', 'verified', 'completed'].includes(kycStatus);
    if (!profile || !hasPassedKyc) {
      return res.status(403).json({
        success: false,
        code: 'KYC_REQUIRED',
        message: 'Identity verification is required before withdrawing funds. Please complete KYC in your profile.',
      });
    }

    const beneficiary = await getActiveBeneficiary(user.id);
    if (!beneficiary) {
      return res.status(400).json({ success: false, message: 'No payout account linked. Please add one first.' });
    }
    if (beneficiary.currency !== walletCurrency) {
      return res.status(400).json({
        success: false,
        message: `This payout route is not currently supported. Add a payout account in your wallet currency (${walletCurrency}).`,
      });
    }

    if ((profile.available_balance || 0) < withdrawalAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    await assertNoActiveWithdrawal(null, user.id);

    const reference = `BAGO-WD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    const debit = await queryOne(
      `UPDATE public.wallet_accounts
       SET available_balance = available_balance - $2, updated_at = NOW()
       WHERE user_id = $1 AND currency = $3 AND available_balance >= $2
       RETURNING available_balance`,
      [user.id, withdrawalAmount, walletCurrency],
    );
    if (!debit) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    await pgQuery(
      `INSERT INTO public.wallet_transactions
        (wallet_id, user_id, type, amount, currency, status, description, metadata)
       VALUES ($1, $2, 'withdrawal', $3, $4, 'processing', $5, $6)`,
      [
        profile.wallet_id,
        user.id,
        withdrawalAmount,
        walletCurrency,
        'Flutterwave bank withdrawal',
        { provider: 'flutterwave', reference },
      ],
    ).catch(() => {});

    const transfer = beneficiary.flutterwave_recipient_id
      ? await initiateOrchestratedTransfer({
          recipientId: beneficiary.flutterwave_recipient_id,
          senderId: beneficiary.flutterwave_sender_id,
          amount: withdrawalAmount,
          sourceCurrency: walletCurrency,
          narration: 'Bago wallet withdrawal',
          reference,
        })
      : await initiateTransfer({
          accountBank: beneficiary.bank_code,
          accountNumber: beneficiary.type === 'iban' ? beneficiary.iban : beneficiary.account_number,
          swiftCode: beneficiary.swift_code,
          amount: withdrawalAmount,
          currency: walletCurrency,
          narration: 'Bago wallet withdrawal',
          reference,
          beneficiaryName: beneficiary.account_holder_name,
        });

    if (!transfer.success) {
      await pgQuery(
        `UPDATE public.wallet_accounts SET available_balance = available_balance + $2, updated_at = NOW() WHERE user_id = $1`,
        [user.id, withdrawalAmount],
      );
      await pgQuery(
        `UPDATE public.wallet_transactions SET status = 'failed', updated_at = NOW() WHERE metadata->>'reference' = $1`,
        [reference],
      ).catch(() => {});
      return res.status(400).json({ success: false, message: transfer.message || 'Transfer failed' });
    }

    await sendWithdrawalSubmittedEmail(
      profile.email || user.email,
      [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim(),
      { amount: withdrawalAmount, currency: walletCurrency, reference, method: 'bank account' },
    ).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Withdrawal initiated successfully',
      reference,
      status: transfer.status,
    });
  } catch (error) {
    console.error('Flutterwave withdrawal error:', error);
    return res.status(500).json({ success: false, message: 'Withdrawal could not be completed. Please try again.' });
  }
};
