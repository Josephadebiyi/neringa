import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

import { Resend } from 'resend';
import {
  addPushToken,
  clearPushTokens,
  applySignupBonus,
  checkDuplicateNameDob,
  confirmPendingEmailChange,
  confirmPendingPhoneChange,
  createOrUpdateAppleProfile,
  createOrUpdateGoogleProfile,
  createProfileWithWallet,
  findActivePromoCode,
  findProfileByEmail,
  findProfileById,
  findProfileByReferralCode,
  getWalletByUserId,
  setPendingEmailChange,
  setPendingPhoneChange,
  updatePasswordOtp,
  updatePreferredCurrency,
  clearOtpAndUpdatePassword,
} from '../lib/postgres/profiles.js';
import { queryOne } from '../lib/postgres/db.js';
import { getPaymentGateway, getCurrencyByCountry } from '../constants/countries.js';
import { sendWelcomeEmail, generateOtpEmailHtml } from '../services/emailNotifications.js';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const FALLBACK_GOOGLE_WEB_CLIENT_ID =
  '207312508850-kgpk9uramqhjkhjeqds4bfdkotm1iqo0.apps.googleusercontent.com';
const FALLBACK_GOOGLE_IOS_CLIENT_ID =
  '207312508850-iebcq2acbvgv1emdv7lkfo2o53dk3qkd.apps.googleusercontent.com';

function buildUserResponse(user) {
  return {
    id: user.id,
    _id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    dateOfBirth: user.dateOfBirth,
    country: user.country,
    image: user.image,
    kycStatus: user.kycStatus,
    isKycCompleted: user.kycStatus === 'approved',
    paymentGateway: user.paymentGateway,
    preferredCurrency: user.preferredCurrency,
    emailVerified: user.emailVerified,
    selectedAvatar: user.selectedAvatar,
    pushTokens: user.pushTokens,
    walletBalance: Number(user.balance || 0),
    wallet_balance: Number(user.balance || 0),
    escrowBalance: Number(user.escrowBalance || 0),
    escrow_balance: Number(user.escrowBalance || 0),
    bankAccountLinked: Boolean(user.paystackRecipientCode || user.bankDetails?.accountNumber),
    bank_account_linked: Boolean(user.paystackRecipientCode || user.bankDetails?.accountNumber),
  };
}

function signUserToken(user) {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, kycStatus: user.kycStatus },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );
  const refreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  const refreshToken = jwt.sign(
    { id: user.id, email: user.email },
    refreshSecret,
    { expiresIn: '30d' },
  );
  return { accessToken, refreshToken };
}

async function resolveGoogleProfile({ idToken, accessToken, googleAudiences }) {
  if (idToken) {
    try {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleAudiences,
      });
      const payload = ticket.getPayload();
      return {
        email: payload.email,
        givenName: payload.given_name,
        familyName: payload.family_name,
        picture: payload.picture,
      };
    } catch (error) {
      try {
        const response = await axios.get(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
        );
        const payload = response.data || {};
        const normalizedAudience = String(payload.aud || '').trim();
        if (
          normalizedAudience &&
          googleAudiences.length > 0 &&
          !googleAudiences.includes(normalizedAudience)
        ) {
          throw new Error(`Google token audience mismatch: ${normalizedAudience}`);
        }

        return {
          email: payload.email,
          givenName: payload.given_name,
          familyName: payload.family_name,
          picture: payload.picture,
        };
      } catch (tokenInfoError) {
        console.warn(
          'googleAuth tokeninfo fallback failed:',
          tokenInfoError?.message || tokenInfoError,
        );
      }

      if (!accessToken) {
        throw error;
      }
      console.warn('googleAuth idToken verification failed, falling back to access token userinfo:', error.message);
    }
  }

  if (accessToken) {
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
    );
    return {
      email: response.data.email,
      givenName: response.data.given_name,
      familyName: response.data.family_name,
      picture: response.data.picture,
    };
  }

  throw new Error('Google token is required');
}

export async function signUp(req, res) {
  try {
    let { firstName, lastName, fullName, email, phone, password, confirmPassword, referralCode, promoCode, dateOfBirth, country } = req.body;

    if (!firstName && fullName) {
      const parts = fullName.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.length > 1 ? parts.slice(1).join(' ') : 'User';
    }

    if (!firstName) firstName = 'Bago';
    if (!lastName) lastName = 'User';
    if (!dateOfBirth) dateOfBirth = '2000-01-01';

    if (!email || !phone || !password || !confirmPassword || !country) {
      return res.status(400).json({ message: 'Please fill in all required fields: email, phone, country, and password' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one letter and one number' });
    }

    const existingUser = await findProfileByEmail(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await findProfileByReferralCode(referralCode);
      if (referrer) referredBy = referrer.id;
    }

    if (promoCode) {
      const promo = await findActivePromoCode(promoCode.toUpperCase());
      if (!promo) {
        return res.status(400).json({ message: 'Invalid promo code' });
      }
      if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) {
        return res.status(400).json({ message: 'Promo code has expired' });
      }
      if (promo.max_uses && promo.used_count >= promo.max_uses) {
        return res.status(400).json({ message: 'Promo code limit reached' });
      }
    }

    const activationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    // Hash the password before embedding in the JWT — never store plaintext in tokens
    const hashedPasswordForToken = await bcrypt.hash(password, 10);
    const signupToken = jwt.sign(
      {
        firstName,
        lastName,
        email: email.toLowerCase(),
        phone,
        passwordHash: hashedPasswordForToken,
        referredBy,
        promoCode: promoCode ? promoCode.toUpperCase() : null,
        dateOfBirth,
        country,
        otp: activationOtp,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' },
    );

    if (resend) {
      await resend.emails.send({
        from: 'Bago <no-reply@sendwithbago.com>',
        to: email,
        subject: `${activationOtp} is your Bago verification code`,
        html: generateOtpEmailHtml({ firstName, otp: activationOtp, subtitle: 'Thank you for joining Bago! Use the code below to complete your registration.' }),
      });
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent to your email.',
      signupToken,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ message: error.message });
  }
}

export async function verifySignupOtp(req, res) {
  try {
    const { signupToken, otp } = req.body;
    if (!signupToken || !otp) {
      return res.status(400).json({ message: 'Token and OTP are required' });
    }

    const decoded = jwt.verify(signupToken, process.env.JWT_SECRET);
    if (decoded.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const existingUser = await findProfileByEmail(decoded.email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const isDuplicateIdentity = await checkDuplicateNameDob(decoded.firstName, decoded.lastName, decoded.dateOfBirth);
    if (isDuplicateIdentity) {
      return res.status(400).json({
        message: 'An account with this name and date of birth already exists. Each person may only have one Bago account.',
      });
    }

    // Use pre-hashed password from token (passwordHash field); legacy tokens may have plain password field
    const passwordHash = decoded.passwordHash || await bcrypt.hash(decoded.password, 10);
    const paymentGateway = getPaymentGateway(decoded.country);
    const preferredCurrency = getCurrencyByCountry(decoded.country);

    const newUser = await createProfileWithWallet({
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      email: decoded.email,
      phone: decoded.phone,
      passwordHash,
      referredBy: decoded.referredBy || null,
      dateOfBirth: decoded.dateOfBirth || null,
      country: decoded.country || null,
      paymentGateway,
      preferredCurrency,
      signupMethod: 'email',
      emailVerified: true,
    });

    if (decoded.promoCode) {
      await applySignupBonus(newUser.id, decoded.promoCode);
    }

    if (resend) {
      await resend.emails.send({
        from: 'Bago Team <no-reply@sendwithbago.com>',
        to: decoded.email,
        subject: `Welcome to Bago, ${decoded.firstName}!`,
        html: `<p>Welcome to Bago, ${decoded.firstName}.</p>`,
      });
    }

    const { accessToken, refreshToken } = signUserToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Account verified successfully!',
      token: accessToken,
      refreshToken,
      user: buildUserResponse(newUser),
    });
  } catch (error) {
    console.error('verifySignupOtp error:', error);
    const message = error.name === 'TokenExpiredError'
      ? 'Verification session expired. Please sign up again.'
      : error.message;
    res.status(400).json({ message });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await findProfileByEmail(email.toLowerCase());
    // Return identical 200 regardless of whether email exists (prevents enumeration)
    if (!user) return res.status(200).json({ message: 'If that email is registered, a reset code has been sent.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await updatePasswordOtp(email.toLowerCase(), otp, new Date(Date.now() + 5 * 60 * 1000));

    if (resend) {
      await resend.emails.send({
        from: 'Bago <no-reply@sendwithbago.com>',
        to: email,
        subject: 'Reset your Bago password',
        html: generateOtpEmailHtml({ firstName: user.firstName || 'there', otp, subtitle: `We received a request to reset the password for <strong style="color:#111827;">${email}</strong>.`, expiryNote: 'This code expires in 5 minutes.' }),
      });
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await findProfileByEmail(email.toLowerCase());
    if (!user || !user.otp_code) {
      return res.status(400).json({ message: 'No OTP found for this user' });
    }
    if (new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }
    if (user.otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '10m' });
    res.status(200).json({ message: 'OTP verified', token });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await findProfileByEmail(email.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await updatePasswordOtp(email.toLowerCase(), otp, new Date(Date.now() + 5 * 60 * 1000));

    if (resend) {
      await resend.emails.send({
        from: 'Bago <no-reply@sendwithbago.com>',
        to: email,
        subject: 'Your Bago verification code',
        html: generateOtpEmailHtml({ firstName: user.firstName || 'there', otp, subtitle: `We received a request to resend your verification code for <strong style="color:#111827;">${email}</strong>.`, expiryNote: 'This code expires in 5 minutes.' }),
      });
    }

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('resendOtp error:', error);
    res.status(500).json({ message: 'Server error' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, newPassword } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized, missing reset token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.email || decoded.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(401).json({ message: 'Unauthorized, token email mismatch' });
    }

    const user = await findProfileByEmail(email.toLowerCase());
    if (!user) return res.status(404).json({ message: 'User not found' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await clearOtpAndUpdatePassword(email.toLowerCase(), passwordHash);

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ message: 'Server error while resetting password' });
  }
}

export async function signIn(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    const user = await findProfileByEmail(email.toLowerCase());
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (user.banned) {
      return res.status(403).json({ message: 'Account has been suspended' });
    }

    const { accessToken, refreshToken } = signUserToken(user);
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: 'Sign-in successful',
      token: accessToken,
      refreshToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('signIn error:', error);
    res.status(400).json({ message: error.message });
  }
}

export async function getUser(req, res) {
  try {
    const user = await findProfileById(req.user.id || req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ success: true, user: buildUserResponse(user) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function googleAuth(req, res) {
  try {
    const { idToken, accessToken, referralCode, promoCode, country } = req.body;
    const googleAudiences = Array.from(new Set([
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      FALLBACK_GOOGLE_WEB_CLIENT_ID,
      FALLBACK_GOOGLE_IOS_CLIENT_ID,
    ].filter(Boolean)));
    if (idToken && !googleAudiences.length && !accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Google login is not configured on the server',
      });
    }

    const {
      email,
      givenName,
      familyName,
      picture,
    } = await resolveGoogleProfile({
      idToken,
      accessToken,
      googleAudiences,
    });

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google account email could not be resolved',
      });
    }

    const { user, isNewUser } = await createOrUpdateGoogleProfile({
      email: email.toLowerCase(),
      firstName: givenName || 'User',
      lastName: familyName || 'Bago',
      imageUrl: picture || null,
      referralCode: referralCode || null,
      promoCode: promoCode || null,
      country: country || 'United States',
    });

    if (user.banned) {
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }

    if (isNewUser) {
      await sendWelcomeEmail(user.email, user.firstName || 'User', 'google').catch(() => {});
    }

    const { accessToken: userAccessToken, refreshToken: userRefreshToken } = signUserToken(user);
    res.cookie('token', userAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: isNewUser ? 'Google signup successful' : 'Google sign-in successful',
      isNewUser,
      token: userAccessToken,
      refreshToken: userRefreshToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('googleAuth error:', error);
    const status =
      error?.message?.includes('Wrong recipient') ||
      error?.message?.includes('Token used too late') ||
      error?.message?.includes('Invalid token') ||
      error?.message?.includes('No pem found') ||
      error?.message?.includes('audience')
        ? 401
        : 500;

    res.status(status).json({
      success: false,
      message:
        status === 401
          ? 'Google login could not be verified'
          : 'Internal server error during Google login',
    });
  }
}

// ─── Apple Sign-In ──────────────────────────────────────────────────────────

import crypto from 'crypto';

async function verifyAppleIdentityToken(identityToken) {
  const [headerB64] = identityToken.split('.');
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));

  const { data: jwks } = await axios.get('https://appleid.apple.com/auth/keys', { timeout: 8000 });
  const jwk = jwks.keys.find(k => k.kid === header.kid);
  if (!jwk) throw new Error('Apple public key not found for kid: ' + header.kid);

  const pubKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const pem = pubKey.export({ type: 'spki', format: 'pem' });
  return jwt.verify(identityToken, pem, { algorithms: ['RS256'] });
}

export async function appleAuth(req, res) {
  try {
    const { identityToken, firstName, lastName, email } = req.body;

    if (!identityToken) {
      return res.status(400).json({ success: false, message: 'identityToken is required' });
    }

    let decoded;
    try {
      decoded = await verifyAppleIdentityToken(identityToken);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid Apple identity token' });
    }

    const appleSub = decoded.sub;
    const resolvedEmail = email || decoded.email || null;

    const { user, isNewUser } = await createOrUpdateAppleProfile({
      appleSub,
      email: resolvedEmail,
      firstName: firstName || null,
      lastName: lastName || null,
    });

    if (user.banned) {
      return res.status(403).json({ success: false, message: 'Account has been suspended' });
    }

    if (isNewUser) {
      await sendWelcomeEmail(user.email, user.firstName || 'User', 'apple').catch(() => {});
    }

    const { accessToken, refreshToken } = signUserToken(user);
    res.cookie('token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
      sameSite: 'lax',
    });

    res.status(200).json({
      success: true,
      message: isNewUser ? 'Apple signup successful' : 'Apple sign-in successful',
      isNewUser,
      token: accessToken,
      refreshToken,
      user: buildUserResponse(user),
    });
  } catch (error) {
    console.error('appleAuth error:', error);
    res.status(500).json({ success: false, message: 'Apple sign-in failed. Please try again.' });
  }
}

export async function logout(req, res) {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
}

export async function requestEmailChange(req, res) {
  try {
    const { newEmail } = req.body;
    const user = await findProfileById(req.user.id || req.user._id);

    if (!newEmail) return res.status(400).json({ message: 'New email is required' });
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return res.status(400).json({ message: 'New email must be different from current email' });
    }

    const existing = await findProfileByEmail(newEmail.toLowerCase());
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await setPendingEmailChange(user.id, newEmail.toLowerCase(), otp, new Date(Date.now() + 15 * 60 * 1000));

    if (resend) {
      await resend.emails.send({
        from: 'Bago <no-reply@sendwithbago.com>',
        to: newEmail,
        subject: 'Bago - Your Email Verification Code',
        html: `<p>Your email verification code is <strong>${otp}</strong>.</p>`,
      });
    }

    res.status(200).json({ success: true, message: 'Verification code sent to your new email.' });
  } catch (error) {
    console.error('requestEmailChange error:', error);
    res.status(500).json({ message: error.message });
  }
}

export async function verifyEmailChange(req, res) {
  try {
    const { otp } = req.body;
    const user = await findProfileById(req.user.id || req.user._id);

    if (!user.pendingEmail || !user.email_change_otp_code) {
      return res.status(400).json({ message: 'No email change request found' });
    }

    if (new Date(user.email_change_otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (user.email_change_otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    await confirmPendingEmailChange(user.id, user.pendingEmail);
    res.status(200).json({ success: true, message: 'Email updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function requestPhoneChange(req, res) {
  try {
    const { newPhone } = req.body;
    const user = await findProfileById(req.user.id || req.user._id);

    if (!newPhone) return res.status(400).json({ message: 'New phone number is required' });
    if (newPhone.trim() === user.phone?.trim()) {
      return res.status(400).json({ message: 'New phone must be different from current phone' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await setPendingPhoneChange(user.id, newPhone.trim(), otp, new Date(Date.now() + 15 * 60 * 1000));

    if (resend) {
      await resend.emails.send({
        from: 'Bago <no-reply@sendwithbago.com>',
        to: user.email,
        subject: 'Verify your new phone number',
        html: generateOtpEmailHtml({ firstName: user.firstName || 'there', otp, subtitle: 'Use this code to verify your new phone number.', expiryNote: 'This code expires in 15 minutes.' }),
      }).catch(() => {});
    }

    res.status(200).json({ success: true, message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('requestPhoneChange error:', error);
    res.status(500).json({ message: error.message });
  }
}

export async function verifyPhoneChange(req, res) {
  try {
    const { otp } = req.body;
    const user = await findProfileById(req.user.id || req.user._id);

    if (!user.pendingPhone || !user.phone_change_otp_code) {
      return res.status(400).json({ message: 'No phone change request found' });
    }

    if (new Date(user.phone_change_otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Verification code expired' });
    }

    if (user.phone_change_otp_code !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    await confirmPendingPhoneChange(user.id, user.pendingPhone);
    res.status(200).json({ success: true, message: 'Phone number updated successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function getWallet(req, res) {
  try {
    const wallet = await getWalletByUserId(req.user.id || req.user._id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    res.status(200).json({
      success: true,
      balance: wallet.balance,
      escrowBalance: wallet.escrowBalance,
      currency: wallet.currency,
      history: wallet.history,
      data: {
        balance: wallet.balance,
        escrowBalance: wallet.escrowBalance,
        currency: wallet.currency,
        history: wallet.history,
      },
    });
  } catch (error) {
    console.error('getWallet error:', error);
    res.status(500).json({ message: error.message });
  }
}

export async function savePushToken(req, res) {
  try {
    const { token, deviceToken, pushToken } = req.body;
    const resolvedToken = (token || deviceToken || pushToken || '').trim();
    if (!resolvedToken) return res.status(400).json({ success: false, message: 'Token is required' });
    
    const userId = req.user.id || req.user._id;
    console.log(`🔔 savePushToken: user=${userId}, tokenLen=${resolvedToken.length}, prefix=${resolvedToken.substring(0, 30)}...`);
    
    const updateResult = await addPushToken(userId, resolvedToken);
    if (!updateResult) {
      console.warn(`⚠️ savePushToken: no profile row updated for authenticated user ${userId}`);
      return res.status(404).json({
        success: false,
        message: 'Authenticated user profile was not found',
      });
    }
    
    // Verify it was stored
    const { queryOne: qOne } = await import('../lib/postgres/db.js');
    const row = await qOne(`SELECT push_tokens FROM public.profiles WHERE id = $1`, [userId]);
    const storedTokens = row?.push_tokens || [];
    const isStored = storedTokens.includes(resolvedToken);
    
    console.log(`🔔 Token stored: ${isStored}, total tokens for user: ${storedTokens.length}`);
    
    res.json({ 
      success: true, 
      message: 'Push token registered successfully',
      stored: isStored,
      totalTokens: storedTokens.length,
    });
  } catch (error) {
    console.error('savePushToken error:', error);
    res.status(500).json({ success: false, message: 'Failed to save push token' });
  }
}

export async function removePushToken(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const token = req.body?.token || req.body?.pushToken || req.body?.deviceToken;

    if (token) {
      // Remove only the specific device token
      await queryOne(
        `UPDATE public.profiles SET push_tokens = array_remove(push_tokens, $2), updated_at = NOW() WHERE id = $1`,
        [userId, token],
      );
    } else {
      // Fallback: clear all (e.g. full logout)
      await clearPushTokens(userId);
    }

    res.json({ success: true, message: 'Push token removed' });
  } catch (error) {
    console.error('removePushToken error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove push token' });
  }
}

export async function getCommunicationPrefs(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const row = await queryOne(
      'select communication_prefs from public.profiles where id = $1',
      [userId],
    );
    const prefs = row?.communication_prefs || { push: true, email: true, sms: false };
    return res.json({ success: true, data: prefs });
  } catch (error) {
    console.error('getCommunicationPrefs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get preferences' });
  }
}

export async function updateCommunicationPrefs(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { push, email, sms } = req.body;
    const prefs = {
      push: typeof push === 'boolean' ? push : true,
      email: typeof email === 'boolean' ? email : true,
      sms: typeof sms === 'boolean' ? sms : false,
    };
    await queryOne(
      `update public.profiles set communication_prefs = $1, updated_at = timezone('utc', now()) where id = $2`,
      [prefs, userId],
    );
    return res.json({ success: true, message: 'Preferences updated', data: prefs });
  } catch (error) {
    console.error('updateCommunicationPrefs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update preferences' });
  }
}

export async function editCurrency(req, res, next) {
  const { currency } = req.body;
  if (!currency) return res.status(400).json({ message: 'Currency is required' });

  try {
    const normalized = currency.toUpperCase();
    const paymentGateway = ['NGN', 'GHS', 'KES'].includes(normalized) ? 'paystack' : 'stripe';
    await updatePreferredCurrency(req.user.id || req.user._id, normalized, paymentGateway);

    res.status(200).json({
      message: 'Currency updated successfully',
      success: true,
      user: {
        id: req.user.id || req.user._id,
        preferredCurrency: normalized,
        paymentGateway,
      },
    });
  } catch (error) {
    next(error);
  }
}
