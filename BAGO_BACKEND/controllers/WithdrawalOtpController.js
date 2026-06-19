import crypto from 'crypto';

import { query, queryOne } from '../lib/postgres/db.js';
import { generateOtpEmailHtml } from '../services/emailNotifications.js';
import { resend } from '../services/resendClient.js';

const OTP_TTL_MINUTES = Number(process.env.WITHDRAWAL_OTP_TTL_MINUTES || 10);
const WITHDRAWAL_OTP_FROM =
  process.env.WITHDRAWAL_OTP_FROM || 'Bago <no-reply@sendwithbago.com>';

function hashOtp(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function otpMatches(storedHash, value) {
  const calculated = hashOtp(value);
  if (!storedHash || storedHash.length !== calculated.length) return false;
  return crypto.timingSafeEqual(Buffer.from(storedHash), Buffer.from(calculated));
}

function maskEmail(email = '') {
  const [local = '', domain = ''] = String(email).split('@');
  if (!domain) return 'your email';
  return `${local.slice(0, 2)}***@${domain}`;
}

export async function requestWithdrawalOtp(req, res) {
  try {
    if (!resend) {
      return res.status(503).json({
        success: false,
        message: 'Email service is not configured. Please contact support.',
      });
    }

    const userId = req.user?.id;
    const profile = await queryOne(
      `SELECT id, email, first_name, email_verified, phone_verified
       FROM public.profiles
       WHERE id = $1`,
      [userId],
    );
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (!profile.email_verified || !profile.phone_verified) {
      return res.status(403).json({
        success: false,
        code: 'CONTACT_VERIFICATION_REQUIRED',
        message: 'Please verify your email and phone number before withdrawing.',
      });
    }

    const otp = String(crypto.randomInt(100000, 1000000));
    await query(
      `
        UPDATE public.profiles
        SET payout_otp_hash = $2,
            payout_otp_expires_at = timezone('utc', now()) + ($3::int * interval '1 minute'),
            updated_at = timezone('utc', now())
        WHERE id = $1
      `,
      [profile.id, hashOtp(otp), OTP_TTL_MINUTES],
    );

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: WITHDRAWAL_OTP_FROM,
      to: profile.email,
      subject: 'Confirm your Bago withdrawal',
      html: generateOtpEmailHtml({
        firstName: profile.first_name || 'there',
        otp,
        subtitle: 'Use this code to confirm your wallet withdrawal.',
        expiryNote: `This code expires in ${OTP_TTL_MINUTES} minutes.`,
      }),
    });
    if (emailError) {
      console.error('Withdrawal OTP email rejected by provider:', {
        userId: profile.id,
        to: maskEmail(profile.email),
        from: WITHDRAWAL_OTP_FROM,
        error: emailError.message || emailError.name || emailError,
      });
      return res.status(502).json({
        success: false,
        code: 'WITHDRAWAL_OTP_EMAIL_FAILED',
        message: 'Could not send the withdrawal code. Please contact support or try again shortly.',
      });
    }

    console.log('Withdrawal OTP email accepted:', {
      userId: profile.id,
      to: maskEmail(profile.email),
      id: emailData?.id || null,
    });

    return res.json({
      success: true,
      message: 'Withdrawal confirmation code sent.',
      destination: maskEmail(profile.email),
      expiresInMinutes: OTP_TTL_MINUTES,
    });
  } catch (error) {
    console.error('requestWithdrawalOtp error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not send withdrawal confirmation code. Please try again.',
    });
  }
}

export async function requireWithdrawalOtp(req, res, next) {
  try {
    const otp = String(req.body?.otp || '').trim();
    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        code: 'WITHDRAWAL_OTP_REQUIRED',
        message: 'Enter the 6-digit withdrawal confirmation code sent to your email.',
      });
    }

    const profile = await queryOne(
      `SELECT id, payout_otp_hash, payout_otp_expires_at
       FROM public.profiles
       WHERE id = $1`,
      [req.user?.id],
    );

    const expiresAt = profile?.payout_otp_expires_at ? new Date(profile.payout_otp_expires_at) : null;
    if (!profile?.payout_otp_hash || !expiresAt || expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        code: 'WITHDRAWAL_OTP_EXPIRED',
        message: 'Withdrawal confirmation code expired. Request a new code.',
      });
    }

    if (!otpMatches(profile.payout_otp_hash, otp)) {
      return res.status(400).json({
        success: false,
        code: 'WITHDRAWAL_OTP_INVALID',
        message: 'Invalid withdrawal confirmation code.',
      });
    }

    await query(
      `UPDATE public.profiles
       SET payout_otp_hash = NULL,
           payout_otp_expires_at = NULL,
           updated_at = timezone('utc', now())
       WHERE id = $1`,
      [profile.id],
    );

    return next();
  } catch (error) {
    console.error('requireWithdrawalOtp error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Could not verify withdrawal confirmation code.',
    });
  }
}
