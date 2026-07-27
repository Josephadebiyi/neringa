import bcrypt from 'bcrypt';
import cloudinary from 'cloudinary';
import { Resend } from 'resend';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';
import { syncTripCapacity } from '../lib/postgres/tripCapacity.js';
import { updatePreferredCurrency, findProfileById, getWalletByUserId } from '../lib/postgres/profiles.js';
import { FLUTTERWAVE_SUPPORTED_PAYOUT_CURRENCIES } from '../constants/countries.js';

let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --------------------------------------------------------------------------
// IMAGE UPLOAD
// --------------------------------------------------------------------------

export const uploadOrUpdateImage = async (req, res) => {
  try {
    const userId = req.user.id;
    // express-fileupload does not guarantee `req.body` exists for multipart
    // requests that contain only a file. Keep the legacy image/avatar payload
    // handling safe for those uploads.
    const body = req.body || {};
    let imageUrl = null;

    if (req.files && req.files.image) {
      const fileObj = Array.isArray(req.files.image) ? req.files.image[0] : req.files.image;
      if (!fileObj?.data?.length) {
        return res.status(400).json({ success: false, message: 'The selected image is empty.' });
      }
      const mime = fileObj.mimetype || 'image/jpeg';
      const allowedImageTypes = new Set([
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
      ]);
      if (!allowedImageTypes.has(mime.toLowerCase())) {
        return res.status(415).json({
          success: false,
          message: 'Please select a JPEG, PNG, WebP, or HEIC image.',
        });
      }
      const base64 = fileObj.data.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      const result = await cloudinary.v2.uploader.upload(dataUri, {
        folder: 'bago/profile_images',
        public_id: `profile_${userId}_${Date.now()}`,
        resource_type: 'image',
        transformation: [{ width: 1024, height: 1024, crop: 'limit', quality: 'auto' }],
      });
      imageUrl = result.secure_url;
    } else if (body.image) {
      const imageInput = body.image;
      if (/^https?:\/\//i.test(imageInput)) {
        imageUrl = imageInput;
      } else {
        const dataUri = /^data:/.test(imageInput)
          ? imageInput
          : `data:image/jpeg;base64,${imageInput}`;
        const result = await cloudinary.v2.uploader.upload(dataUri, {
          folder: 'bago/profile_images',
          public_id: `profile_${userId}_${Date.now()}`,
        });
        imageUrl = result.secure_url;
      }
    }

    let selectedAvatar = undefined;
    if (body.selectedAvatar !== undefined) {
      selectedAvatar = (body.selectedAvatar === null || body.selectedAvatar === 'null')
        ? null
        : parseInt(body.selectedAvatar);
      if (selectedAvatar) imageUrl = null; // clear image when using avatar
    }

    const updates = [];
    const params = [userId];

    if (imageUrl !== null && imageUrl !== undefined) {
      params.push(imageUrl);
      updates.push(`image_url = $${params.length}`);
      // clear avatar when setting custom image
      updates.push(`selected_avatar = NULL`);
    }

    if (selectedAvatar !== undefined) {
      if (selectedAvatar === null) {
        updates.push(`selected_avatar = NULL`);
      } else {
        params.push(selectedAvatar);
        updates.push(`selected_avatar = $${params.length}`);
        updates.push(`image_url = NULL`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No image or avatar provided' });
    }

    updates.push(`updated_at = NOW()`);
    const row = await queryOne(
      `UPDATE public.profiles SET ${updates.join(', ')} WHERE id = $1
       RETURNING image_url, selected_avatar`,
      params
    );

    res.status(200).json({
      success: true,
      message: imageUrl ? 'Image updated successfully' : 'Avatar updated successfully',
      image: row?.image_url,
      imageUrl: row?.image_url,
      selectedAvatar: row?.selected_avatar,
    });
  } catch (error) {
    console.error('Image Upload/Update Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const uploadBusinessDocument = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await queryOne(
      `SELECT account_type FROM public.profiles WHERE id = $1`,
      [userId],
    );
    if (profile?.account_type !== 'company') {
      return res.status(403).json({ success: false, message: 'Business documents can only be added to business accounts.' });
    }

    const uploaded = req.files?.document;
    const document = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    if (!document?.data?.length) {
      return res.status(400).json({ success: false, message: 'Please upload a CAC or business registration certificate.' });
    }
    if (document.data.length > 10 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: 'The registration certificate must be 10 MB or smaller.' });
    }

    const mime = String(document.mimetype || '').toLowerCase();
    const allowed = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
    if (!allowed.has(mime)) {
      return res.status(415).json({ success: false, message: 'Upload a PDF, JPEG, PNG, or WebP certificate.' });
    }

    const dataUri = `data:${mime};base64,${document.data.toString('base64')}`;
    const result = await cloudinary.v2.uploader.upload(dataUri, {
      folder: 'bago/business_documents',
      public_id: `registration_${userId}_${Date.now()}`,
      resource_type: 'auto',
      type: 'authenticated',
    });
    await pgQuery(
      `UPDATE public.profiles
       SET business_document_url = $2, business_document_status = 'pending_review', updated_at = NOW()
       WHERE id = $1`,
      [userId, result.secure_url],
    );
    return res.status(200).json({ success: true, message: 'Business registration certificate uploaded.', documentStatus: 'pending_review' });
  } catch (error) {
    console.error('Business document upload error:', error);
    return res.status(500).json({ success: false, message: 'Could not upload the business certificate. Please try again.' });
  }
};

export const saveBusinessPayoutDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const currency = String(req.body?.currency || '').trim().toUpperCase();
    const accountHolderName = String(req.body?.accountHolderName || '').trim();
    const accountNumber = String(req.body?.accountNumber || '').replace(/\s+/g, '');
    const bankCode = String(req.body?.bankCode || '').replace(/\s+/g, '');
    const bankName = String(req.body?.bankName || '').trim();
    const iban = String(req.body?.iban || '').replace(/\s+/g, '').toUpperCase();
    const swiftBic = String(req.body?.swiftBic || '').replace(/\s+/g, '').toUpperCase();
    if (!FLUTTERWAVE_SUPPORTED_PAYOUT_CURRENCIES.includes(currency)) {
      return res.status(400).json({ success: false, message: 'Select a supported payout currency.' });
    }
    const usesIban = currency === 'EUR';
    if (!accountHolderName || (usesIban ? (!iban || !swiftBic) : (!accountNumber || !bankCode))) {
      return res.status(400).json({ success: false, message: usesIban
        ? 'Account holder, IBAN, and SWIFT/BIC are required.'
        : 'Account holder, account number, and bank code are required.' });
    }
    const profile = await queryOne(
      `SELECT account_type, preferred_currency FROM public.profiles WHERE id = $1`, [userId],
    );
    if (profile?.account_type !== 'company') {
      return res.status(403).json({ success: false, message: 'This payout draft is only available to business accounts.' });
    }
    if (String(profile.preferred_currency || '').toUpperCase() !== currency) {
      return res.status(400).json({ success: false, message: 'Payout currency must match the business wallet currency.' });
    }
    const details = { accountHolderName, accountNumber, bankCode, bankName, iban, swiftBic, currency };
    await pgQuery(
      `UPDATE public.profiles SET bank_details = $2::jsonb, payout_currency = $3,
       payout_provider = 'flutterwave', payout_method = 'flutterwave',
       payout_status = 'pending_kyc', payout_method_status = 'draft', updated_at = NOW()
       WHERE id = $1`,
      [userId, JSON.stringify(details), currency],
    );
    return res.status(200).json({ success: true, message: 'Payout details saved. They can be confirmed after identity verification.' });
  } catch (error) {
    console.error('Business payout draft error:', error);
    return res.status(500).json({ success: false, message: 'Could not save payout details.' });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selectedAvatar } = req.body || {};

    if (!selectedAvatar || selectedAvatar < 1 || selectedAvatar > 6) {
      return res.status(400).json({ success: false, message: 'Invalid avatar selection (1–6)' });
    }

    await pgQuery(
      `UPDATE public.profiles
       SET selected_avatar = $2, image_url = NULL, updated_at = NOW()
       WHERE id = $1`,
      [userId, selectedAvatar]
    );

    res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      selectedAvatar,
    });
  } catch (error) {
    console.error('Avatar Update Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// PROFILE EDIT
// --------------------------------------------------------------------------

export const edit = async (req, res, next) => {
  const userId = req.user.id;
  const updates = req.body;

  try {
    if (updates.full_name && (!updates.firstName || !updates.lastName)) {
      const parts = String(updates.full_name).trim().split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        updates.firstName = updates.firstName || parts[0];
        updates.lastName = updates.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : '');
      }
    }

    const allowed = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'bankDetails', 'preferredCurrency', 'preferredLanguage', 'country', 'bio'];
    const updateKeys = Object.keys(updates).filter(k => allowed.includes(k));

    if (updateKeys.length === 0) {
      return res.status(400).json({ message: 'No valid update fields provided' });
    }

    if (updateKeys.includes('bio')) {
      updates.bio = String(updates.bio || '').trim();
      if (updates.bio.length > 250) {
        return res.status(400).json({ success: false, message: 'Bio must be 250 characters or fewer.' });
      }
    }
    if (updateKeys.includes('preferredLanguage')) {
      updates.preferredLanguage = String(updates.preferredLanguage || '').trim().toLowerCase();
      if (!['en', 'de', 'fr', 'es', 'pt', 'it'].includes(updates.preferredLanguage)) {
        return res.status(400).json({ success: false, message: 'Unsupported language.' });
      }
    }

    // Read old preferred currency BEFORE the update so wallet conversion has a fallback
    let oldPreferredCurrency = null;
    const identityUpdateKeys = updateKeys.filter((key) => ['firstName', 'lastName', 'dateOfBirth'].includes(key));
    if (identityUpdateKeys.length > 0) {
      const profile = await queryOne(
        `SELECT kyc_status, identity_fields_locked FROM public.profiles WHERE id = $1`,
        [userId],
      );
      const kycStatus = String(profile?.kyc_status || '').trim().toLowerCase();
      const identityLocked =
        profile?.identity_fields_locked === true ||
        ['approved', 'verified', 'completed'].includes(kycStatus);
      if (identityLocked) {
        return res.status(403).json({
          success: false,
          code: 'IDENTITY_FIELDS_LOCKED',
          message: 'Name and date of birth are locked after identity verification.',
        });
      }
    }

    if (updateKeys.includes('preferredCurrency')) {
      const current = await queryOne(
        `SELECT preferred_currency FROM public.profiles WHERE id = $1`, [userId]
      );
      oldPreferredCurrency = current?.preferred_currency || null;
    }

    const sets = [];
    const params = [userId];

    for (const key of updateKeys) {
      const colMap = {
        firstName: 'first_name',
        lastName: 'last_name',
        phone: 'phone',
        dateOfBirth: 'date_of_birth',
        bankDetails: 'bank_details',
        preferredCurrency: 'preferred_currency',
        preferredLanguage: 'preferred_language',
        country: 'country',
        bio: 'bio',
      };
      const col = colMap[key];
      if (!col) continue;
      params.push(key === 'bankDetails' ? JSON.stringify(updates[key]) : updates[key]);
      sets.push(`${col} = $${params.length}`);
    }

    sets.push(`updated_at = NOW()`);
    const row = await queryOne(
      `UPDATE public.profiles SET ${sets.join(', ')} WHERE id = $1
       RETURNING id, first_name, last_name, email, phone, date_of_birth,
                 preferred_currency, preferred_language, country, bank_details, image_url, selected_avatar, bio`,
      params
    );

    // Convert wallet balance when currency changes
    if (updateKeys.includes('preferredCurrency') && updates.preferredCurrency) {
      const newCurrency = updates.preferredCurrency.toUpperCase();
      await updatePreferredCurrency(userId, newCurrency, 'flutterwave', oldPreferredCurrency);
    }

    // Re-fetch full profile so wallet balance/currency reflect the conversion
    const updatedProfile = await findProfileById(userId);
    const wallet = await getWalletByUserId(userId).catch((error) => {
      console.warn('updateProfile wallet display formatting unavailable:', error.message);
      return null;
    });
    const displayBalance = wallet?.walletDisplayBalance ?? wallet?.displayBalance ?? updatedProfile?.walletBalance ?? updatedProfile?.balance ?? 0;
    const displayCurrency = wallet?.walletDisplayCurrency ?? wallet?.displayCurrency ?? row.preferred_currency;
    const displayEscrowBalance = wallet?.escrowDisplayBalance ?? wallet?.displayEscrowBalance ?? updatedProfile?.escrowBalance ?? 0;
    const rawBalance = wallet?.walletBalance ?? wallet?.balance ?? updatedProfile?.walletBalance ?? updatedProfile?.balance ?? 0;
    const rawEscrowBalance = wallet?.escrowBalance ?? updatedProfile?.escrowBalance ?? 0;
    const walletCurrency = wallet?.walletCurrency || wallet?.currency || row.preferred_currency;

    return res.status(200).json({
      status: 'success',
      data: {
        id: row.id,
        _id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        dateOfBirth: row.date_of_birth,
        preferredCurrency: row.preferred_currency,
        preferredLanguage: row.preferred_language || 'en',
        country: row.country,
        bankDetails: row.bank_details,
        image: row.image_url,
        selectedAvatar: row.selected_avatar,
        bio: updatedProfile?.bio || '',
        walletBalance: displayBalance,
        wallet_balance: displayBalance,
        availableBalance: displayBalance,
        available_balance: displayBalance,
        escrowBalance: displayEscrowBalance,
        escrow_balance: displayEscrowBalance,
        rawWalletBalance: rawBalance,
        raw_wallet_balance: rawBalance,
        rawEscrowBalance: rawEscrowBalance,
        raw_escrow_balance: rawEscrowBalance,
        walletCurrency,
        wallet_currency: walletCurrency,
        displayCurrency,
        display_currency: displayCurrency,
        walletDisplayCurrency: displayCurrency,
        wallet_display_currency: displayCurrency,
        walletDisplayBalance: displayBalance,
        wallet_display_balance: displayBalance,
        escrowDisplayBalance: displayEscrowBalance,
        escrow_display_balance: displayEscrowBalance,
        currency: displayCurrency,
      },
    });
  } catch (error) {
    next(error);
  }
};

// --------------------------------------------------------------------------
// EMAIL AVAILABILITY
// --------------------------------------------------------------------------

export const checkEmailAvailability = async (req, res) => {
  try {
    const email = req.body?.email?.toLowerCase()?.trim();
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const existing = await queryOne(
      `SELECT id FROM public.profiles WHERE lower(email) = lower($1)`,
      [email]
    );

    return res.status(200).json({
      success: true,
      available: !existing,
      message: existing ? 'Email already registered' : 'Email is available',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --------------------------------------------------------------------------
// WALLET OPERATIONS  (balances live in public.profiles)
// --------------------------------------------------------------------------

export const addFunds = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { amount, description } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Positive amount required' });
    }

    const row = await queryOne(
      `UPDATE public.profiles
       SET available_balance = available_balance + $2, updated_at = NOW()
       WHERE id = $1
       RETURNING available_balance`,
      [userId, amount]
    );

    if (!row) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ success: true, message: 'Funds added', balance: row.available_balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendToEscrow = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Positive amount required' });
    }

    const profile = await queryOne(
      `SELECT available_balance FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!profile) return res.status(404).json({ message: 'User not found' });
    if ((profile.available_balance || 0) < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    const row = await queryOne(
      `UPDATE public.profiles
       SET available_balance = available_balance - $2,
           escrow_balance = escrow_balance + $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING available_balance, escrow_balance`,
      [userId, amount]
    );

    res.status(200).json({
      success: true,
      message: 'Funds moved to escrow',
      balance: row.available_balance,
      escrowBalance: row.escrow_balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const releaseFromEscrow = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Positive amount required' });
    }

    const profile = await queryOne(
      `SELECT escrow_balance FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!profile) return res.status(404).json({ message: 'User not found' });
    if ((profile.escrow_balance || 0) < amount) {
      return res.status(400).json({ message: 'Insufficient escrow balance' });
    }

    const row = await queryOne(
      `UPDATE public.profiles
       SET escrow_balance = escrow_balance - $2,
           available_balance = available_balance + $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING available_balance, escrow_balance`,
      [userId, amount]
    );

    res.status(200).json({
      success: true,
      message: 'Funds released from escrow',
      balance: row.available_balance,
      escrowBalance: row.escrow_balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addToEscrow = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Positive amount required' });
    }

    const row = await queryOne(
      `UPDATE public.profiles
       SET escrow_balance = escrow_balance + $2, updated_at = NOW()
       WHERE id = $1
       RETURNING escrow_balance`,
      [userId, amount]
    );

    if (!row) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      success: true,
      message: 'Funds added to escrow',
      escrowBalance: row.escrow_balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const handleCancelledRequestEscrow = async (req, res) => {
  try {
    const { requestId, description } = req.body;
    if (!requestId) return res.status(400).json({ message: 'requestId is required' });

    const request = await queryOne(
      `SELECT id, sender_id, trip_id, amount, status FROM public.shipment_requests WHERE id = $1`,
      [requestId]
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status === 'cancelled') {
      return res.status(400).json({ message: 'Request is already cancelled' });
    }

    await pgQuery(
      `UPDATE public.shipment_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
      [requestId]
    );

    if (request.trip_id) {
      await syncTripCapacity({ query: pgQuery }, request.trip_id);
    }

    const escrowAmount = parseFloat(request.amount) || 0;
    if (escrowAmount > 0 && request.sender_id) {
      await pgQuery(
        `UPDATE public.profiles
         SET escrow_balance = GREATEST(escrow_balance - $2, 0), updated_at = NOW()
         WHERE id = $1`,
        [request.sender_id, escrowAmount]
      );
    }

    const updated = await queryOne(
      `SELECT escrow_balance FROM public.profiles WHERE id = $1`,
      [request.sender_id]
    );

    res.status(200).json({
      success: true,
      message: `Request cancelled and escrow of ${escrowAmount} removed`,
      escrowBalance: updated?.escrow_balance || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --------------------------------------------------------------------------
// USER STATS
// --------------------------------------------------------------------------

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const [completedRow, activeRow, totalRow, thisMonthRow, lastMonthRow] = await Promise.all([
      queryOne(
        `SELECT COUNT(*) as count FROM public.shipment_requests
         WHERE (sender_id = $1 OR traveler_id = $1) AND status = 'completed'`,
        [userId]
      ),
      queryOne(
        `SELECT COUNT(*) as count FROM public.shipment_requests
         WHERE (sender_id = $1 OR traveler_id = $1)
           AND status IN ('accepted', 'intransit', 'delivering')`,
        [userId]
      ),
      queryOne(`SELECT COUNT(*) as count FROM public.profiles`, []),
      queryOne(
        `SELECT COUNT(*) as count FROM public.shipment_requests
         WHERE (sender_id = $1 OR traveler_id = $1)
           AND created_at >= date_trunc('month', now())`,
        [userId]
      ),
      queryOne(
        `SELECT COUNT(*) as count FROM public.shipment_requests
         WHERE (sender_id = $1 OR traveler_id = $1)
           AND created_at >= date_trunc('month', now() - interval '1 month')
           AND created_at < date_trunc('month', now())`,
        [userId]
      ),
    ]);

    res.json({
      success: true,
      totalUsers: (parseInt(totalRow?.count) || 0) + 1240,
      completedBookings: parseInt(completedRow?.count) || 0,
      activePackages: parseInt(activeRow?.count) || 0,
      thisMonthShipments: parseInt(thisMonthRow?.count) || 0,
      lastMonthShipments: parseInt(lastMonthRow?.count) || 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// DELETE ACCOUNT
// --------------------------------------------------------------------------

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Delete trips, requests, conversations, then profile
    await pgQuery(`DELETE FROM public.trips WHERE user_id = $1`, [userId]);
    await pgQuery(
      `DELETE FROM public.shipment_requests WHERE sender_id = $1 OR traveler_id = $1`,
      [userId]
    );
    await pgQuery(
      `DELETE FROM public.conversations WHERE sender_id = $1 OR traveler_id = $1`,
      [userId]
    );
    await pgQuery(`DELETE FROM public.notifications WHERE user_id = $1`, [userId]);
    await pgQuery(`DELETE FROM public.profiles WHERE id = $1`, [userId]);

    console.log(`🗑️ Account deleted for user ${userId}`);
    res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// --------------------------------------------------------------------------
// REFERRAL / COUPON
// --------------------------------------------------------------------------

export const useReferralDiscount = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const profile = await queryOne(
      `SELECT has_used_referral_discount FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!profile) return res.status(404).json({ message: 'User not found' });
    if (profile.has_used_referral_discount) {
      return res.status(400).json({ message: 'Referral discount already used' });
    }

    await pgQuery(
      `UPDATE public.profiles SET has_used_referral_discount = true, updated_at = NOW() WHERE id = $1`,
      [userId]
    );

    res.status(200).json({ message: 'Referral discount marked as used', hasUsedReferralDiscount: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDelivery = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    const profile = await queryOne(
      `SELECT referred_by, has_used_referral_discount FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!profile) return res.status(404).json({ message: 'User not found' });

    let finalAmount = amount;
    if (profile.referred_by && !profile.has_used_referral_discount) {
      const discount = 0.03 * amount;
      finalAmount = amount - discount;
      await pgQuery(
        `UPDATE public.profiles SET has_used_referral_discount = true, updated_at = NOW() WHERE id = $1`,
        [userId]
      );
    }

    return res.status(200).json({
      message: 'Delivery created successfully',
      originalAmount: amount,
      finalAmount,
      discountApplied: profile.referred_by ? '3%' : 'None',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing delivery' });
  }
};
