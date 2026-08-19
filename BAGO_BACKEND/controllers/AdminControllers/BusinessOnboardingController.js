import crypto from 'crypto';
import bcrypt from 'bcrypt';
import cloudinary from 'cloudinary';
import { query, queryOne } from '../../lib/postgres/db.js';
import { createProfileWithWallet, findProfileById } from '../../lib/postgres/profiles.js';
import { getCurrencyByCountry, getPaymentGateway } from '../../constants/countries.js';
import { sendAdminCreatedBusinessAccountEmail, sendBusinessWelcomeEmail, sendKycVerificationLinkEmail } from '../../services/emailNotifications.js';
import { createPremblySessionForUser } from '../PremblyController.js';

// Admin-assisted business onboarding: lets an admin create a fully-fledged
// business account on behalf of a business that can't/won't self-onboard
// through the public /business signup wizard.

function generateTempPassword() {
  // Not stored anywhere in plaintext beyond this request — hashed immediately
  // and emailed once. Base64url keeps it easy to read/type over email.
  return crypto.randomBytes(9).toString('base64url');
}

export const createBusinessAccount = async (req, res, next) => {
  try {
    const {
      companyName, tradingName, businessRegistrationNumber, businessAddress, businessTaxId,
      representativeRole, firstName, lastName, dateOfBirth, email, country, operationalCurrency,
    } = req.body;

    if (!companyName || !tradingName || !businessRegistrationNumber || !email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Company name, trading name, registration number, representative name, and email are required.',
      });
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let preferredCurrency = getCurrencyByCountry(country);
    let paymentGateway = getPaymentGateway(country);
    if (operationalCurrency) preferredCurrency = operationalCurrency;

    const newUser = await createProfileWithWallet({
      firstName,
      lastName,
      email,
      phone: null,
      passwordHash,
      country: country || null,
      dateOfBirth: dateOfBirth || null,
      paymentGateway,
      preferredCurrency,
      signupMethod: 'admin_created',
      signupSource: 'admin',
      emailVerified: true,
      accountType: 'company',
      companyName,
      tradingName,
      businessRegistrationNumber,
      businessAddress,
      businessTaxId,
      representativeRole,
    });

    sendAdminCreatedBusinessAccountEmail(email, `${firstName} ${lastName}`, tradingName || companyName, tempPassword)
      .catch((err) => console.error('Admin-created business account email failed:', err.message));

    return res.status(201).json({ success: true, message: 'Business account created.', data: newUser });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ success: false, message: 'An account with this email or registration number already exists.' });
    }
    next(error);
  }
};

export const adminUploadBusinessDocument = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await queryOne(`SELECT account_type FROM public.profiles WHERE id = $1`, [userId]);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (profile.account_type !== 'company') {
      return res.status(400).json({ success: false, message: 'Business documents can only be added to business accounts.' });
    }

    const file = req.file;
    if (!file?.buffer?.length) {
      return res.status(400).json({ success: false, message: 'Please upload a CAC or business registration certificate.' });
    }

    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.v2.uploader.upload(dataUri, {
      folder: 'bago/business_documents',
      public_id: `registration_${userId}_${Date.now()}`,
      resource_type: 'auto',
      type: 'authenticated',
    });

    await query(
      `UPDATE public.profiles
       SET business_document_url = $2, business_document_status = 'pending_review', updated_at = NOW()
       WHERE id = $1`,
      [userId, result.secure_url],
    );

    return res.status(200).json({ success: true, message: 'Business registration certificate uploaded.', documentStatus: 'pending_review', documentUrl: result.secure_url });
  } catch (error) {
    console.error('Admin business document upload error:', error);
    return res.status(500).json({ success: false, message: 'Could not upload the business certificate. Please try again.' });
  }
};

export const adminGenerateKycLink = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await findProfileById(userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const result = await createPremblySessionForUser(userId, { country: profile.country || '' });

    let emailed = false;
    if (result.verificationUrl && profile.email) {
      const representativeName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
      const businessName = profile.tradingName || profile.companyName;
      emailed = await sendKycVerificationLinkEmail(profile.email, representativeName, businessName, result.verificationUrl)
        .catch((err) => { console.error('KYC verification link email failed:', err.message); return false; });
    }

    return res.status(200).json({ success: true, verificationUrl: result.verificationUrl, activeSession: result.activeSession, emailed });
  } catch (error) {
    console.error('Admin KYC link generation error:', error.message);
    return res.status(error.statusCode || 502).json({ success: false, message: error.message || 'Could not generate a verification link.' });
  }
};

export const approveBusinessAccount = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const profile = await findProfileById(userId);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (profile.accountType !== 'company') {
      return res.status(400).json({ success: false, message: 'This user is not a business account' });
    }

    const representativeName = [profile.firstName, profile.lastName].filter(Boolean).join(' ');
    const businessName = profile.tradingName || profile.companyName;
    sendBusinessWelcomeEmail(profile.email, representativeName, businessName)
      .catch((err) => console.error('Business approval welcome email failed:', err.message));

    return res.status(200).json({ success: true, message: 'Business account approved.' });
  } catch (error) {
    next(error);
  }
};
