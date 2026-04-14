import bcrypt from 'bcrypt';
import cloudinary from 'cloudinary';
import { Resend } from 'resend';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';
import { generateOtpEmailHtml } from '../services/emailNotifications.js';

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
    let imageUrl = null;

    if (req.files && req.files.image) {
      const fileObj = req.files.image;
      const mime = fileObj.mimetype || 'image/jpeg';
      const base64 = fileObj.data.toString('base64');
      const dataUri = `data:${mime};base64,${base64}`;
      const result = await cloudinary.v2.uploader.upload(dataUri, {
        folder: 'bago/profile_images',
        public_id: `profile_${userId}_${Date.now()}`,
      });
      imageUrl = result.secure_url;
    } else if (req.body.image) {
      const imageInput = req.body.image;
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
    if (req.body.selectedAvatar !== undefined) {
      selectedAvatar = (req.body.selectedAvatar === null || req.body.selectedAvatar === 'null')
        ? null
        : parseInt(req.body.selectedAvatar);
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
      selectedAvatar: row?.selected_avatar,
    });
  } catch (error) {
    console.error('Image Upload/Update Error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selectedAvatar } = req.body;

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
    const allowed = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'bankDetails', 'preferredCurrency', 'country'];
    const updateKeys = Object.keys(updates).filter(k => allowed.includes(k));

    if (updateKeys.length === 0) {
      return res.status(400).json({ message: 'No valid update fields provided' });
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
        country: 'country',
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
                 preferred_currency, country, bank_details, image_url, selected_avatar`,
      params
    );

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
        country: row.country,
        bankDetails: row.bank_details,
        image: row.image_url,
        selectedAvatar: row.selected_avatar,
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
    const { userId, amount, description } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'userId and positive amount required' });
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

export const withdrawFunds = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Positive amount required' });
    }
    if (!method || !['stripe', 'bank'].includes(method)) {
      return res.status(400).json({ success: false, message: "Specify payout method: 'stripe' or 'bank'" });
    }

    const profile = await queryOne(
      `SELECT available_balance, stripe_connect_account_id, bank_details, paystack_recipient_code
       FROM public.profiles WHERE id = $1`,
      [userId]
    );

    if (!profile) return res.status(404).json({ success: false, message: 'User not found' });
    if ((profile.available_balance || 0) < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    const row = await queryOne(
      `UPDATE public.profiles
       SET available_balance = available_balance - $2, updated_at = NOW()
       WHERE id = $1
       RETURNING available_balance`,
      [userId, amount]
    );

    // Record in transactions table
    await pgQuery(
      `INSERT INTO public.transactions (user_id, type, amount, status, description, created_at)
       VALUES ($1, 'withdrawal', $2, 'pending', $3, NOW())`,
      [userId, amount, `Withdrawal via ${method}`]
    ).catch(() => {});

    res.status(200).json({
      success: true,
      message: 'Withdrawal request received and is being processed',
      balance: row?.available_balance || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const sendToEscrow = async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'userId and positive amount required' });
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
    const { userId, amount, description } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'userId and positive amount required' });
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
    const { userId, amount } = req.body;
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'userId and positive amount required' });
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
      `SELECT id, sender_id, amount, status FROM public.shipment_requests WHERE id = $1`,
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

    const [completedRow, activeRow, totalRow] = await Promise.all([
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
    ]);

    res.json({
      success: true,
      totalUsers: (parseInt(totalRow?.count) || 0) + 1240,
      completedBookings: parseInt(completedRow?.count) || 0,
      activePackages: parseInt(activeRow?.count) || 0,
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
