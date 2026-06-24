import bcrypt from 'bcrypt';
import cloudinary from 'cloudinary';
import { Resend } from 'resend';
import { query as pgQuery, queryOne } from '../lib/postgres/db.js';
import { syncTripCapacity } from '../lib/postgres/tripCapacity.js';
import { generateOtpEmailHtml, sendWithdrawalSubmittedEmail, sendWithdrawalAdminNotification } from '../services/emailNotifications.js';
import { listActiveAdminEmails } from '../lib/postgres/trips.js';
import { convertCurrency } from '../services/currencyConverter.js';
import { updatePreferredCurrency, findProfileById } from '../lib/postgres/profiles.js';
import { initiateTransfer } from '../services/paystackService.js';
import { assertNoActiveWithdrawal } from '../services/withdrawalSafety.js';

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
    if (updates.full_name && (!updates.firstName || !updates.lastName)) {
      const parts = String(updates.full_name).trim().split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        updates.firstName = updates.firstName || parts[0];
        updates.lastName = updates.lastName || (parts.length > 1 ? parts.slice(1).join(' ') : '');
      }
    }

    const allowed = ['firstName', 'lastName', 'phone', 'dateOfBirth', 'bankDetails', 'preferredCurrency', 'country'];
    const updateKeys = Object.keys(updates).filter(k => allowed.includes(k));

    if (updateKeys.length === 0) {
      return res.status(400).json({ message: 'No valid update fields provided' });
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

    // Convert wallet balance when currency changes
    if (updateKeys.includes('preferredCurrency') && updates.preferredCurrency) {
      const newCurrency = updates.preferredCurrency.toUpperCase();
      const paymentGateway = PAYSTACK_PAYOUT_CURRENCIES.includes(newCurrency) ? 'paystack' : 'stripe';
      await updatePreferredCurrency(userId, newCurrency, paymentGateway, oldPreferredCurrency);
    }

    // Re-fetch full profile so wallet balance/currency reflect the conversion
    const updatedProfile = await findProfileById(userId);

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
        walletBalance: updatedProfile?.walletBalance ?? updatedProfile?.balance ?? 0,
        wallet_balance: updatedProfile?.walletBalance ?? updatedProfile?.balance ?? 0,
        walletCurrency: updatedProfile?.walletCurrency || row.preferred_currency,
        wallet_currency: updatedProfile?.walletCurrency || row.preferred_currency,
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

const DAILY_WITHDRAWAL_LIMIT_USD = Number(process.env.DAILY_WITHDRAWAL_LIMIT_USD || 2000);
const MINIMUM_WITHDRAWAL_USD = Number(process.env.MINIMUM_WITHDRAWAL_USD || 2);
const STRIPE_CONNECT_WITHDRAWAL_FEE = 0;
const PAYSTACK_WITHDRAWAL_FEE_NGN = 200;
const PAYSTACK_PAYOUT_CURRENCIES = [
  'AOA', 'BIF', 'BWP', 'CDF', 'CVE', 'DJF', 'DZD', 'EGP', 'ERN', 'ETB',
  'GHS', 'GMD', 'GNF', 'KES', 'KMF', 'LRD', 'LSL', 'LYD', 'MAD', 'MGA',
  'MRU', 'MUR', 'MWK', 'MZN', 'NAD', 'NGN', 'RWF', 'SCR', 'SDG', 'SLE',
  'SOS', 'SSP', 'STN', 'SZL', 'TZS', 'UGX', 'XAF', 'XOF', 'ZAR', 'ZMW',
  'ZWL',
];

function payoutMethodForCurrency(currency = 'USD') {
  return PAYSTACK_PAYOUT_CURRENCIES.includes(String(currency).toUpperCase()) ? 'bank' : 'stripe';
}

export const withdrawFunds = async (req, res) => {
  try {
    const { amount, method } = req.body;
    const userId = req.user.id;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Positive amount required' });
    }

    const account = await queryOne(
      `SELECT
          p.payout_currency,
          p.payout_status,
          p.stripe_connect_account_id,
          p.stripe_onboarding_complete,
          p.paystack_recipient_code,
          p.email,
          p.first_name,
          p.last_name,
          wa.id as wallet_id,
          wa.available_balance,
          wa.currency
       FROM public.profiles p
       JOIN public.wallet_accounts wa ON wa.user_id = p.id
       WHERE p.id = $1`,
      [userId]
    );

    if (!account) return res.status(404).json({ success: false, message: 'Wallet not found' });

    const walletCurrency = String(account.currency || 'USD').toUpperCase();
    const selectedMethod = method || payoutMethodForCurrency(walletCurrency);

    if (!['stripe', 'bank'].includes(selectedMethod)) {
      return res.status(400).json({ success: false, message: "Specify payout method: 'stripe' or 'bank'" });
    }
    if (selectedMethod !== payoutMethodForCurrency(walletCurrency)) {
      return res.status(400).json({
        success: false,
        message: `${walletCurrency} withdrawals use ${payoutMethodForCurrency(walletCurrency) === 'bank' ? 'bank/Paystack' : 'Stripe Connect'}.`,
      });
    }

    const minimumAmount = await convertCurrency(MINIMUM_WITHDRAWAL_USD, 'USD', walletCurrency);
    if (Number(amount) < minimumAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is ${walletCurrency} ${minimumAmount.toFixed(2)}.`,
      });
    }

    if (selectedMethod === 'stripe') {
      return res.status(410).json({
        success: false,
        message: 'Use /api/payouts/withdraw for Stripe Connect withdrawals.',
        code: 'STRIPE_WITHDRAWAL_ENDPOINT_REQUIRED',
      });
    }
    if (selectedMethod === 'bank' && !account.paystack_recipient_code) {
      return res.status(400).json({ success: false, message: 'Add and verify a bank account before withdrawing.' });
    }

    const withdrawalFee = selectedMethod === 'bank'
      ? Number((walletCurrency === 'NGN'
          ? PAYSTACK_WITHDRAWAL_FEE_NGN
          : await convertCurrency(PAYSTACK_WITHDRAWAL_FEE_NGN, 'NGN', walletCurrency)).toFixed(2))
      : STRIPE_CONNECT_WITHDRAWAL_FEE;
    const payoutAmount = Number((Number(amount) - withdrawalFee).toFixed(2));
    if (payoutAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal amount must be greater than the ${walletCurrency} ${withdrawalFee.toFixed(2)} withdrawal fee.`,
      });
    }

    if (Number(account.available_balance || 0) < Number(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }
    await assertNoActiveWithdrawal(null, userId);

    const amountUsd = walletCurrency === 'USD'
      ? Number(amount)
      : await convertCurrency(Number(amount), walletCurrency, 'USD');

    // Daily limit — sum previous withdrawals using stored amountUsd in metadata
    const dailyTotal = await queryOne(
      `SELECT COALESCE(SUM(
          CASE WHEN currency = 'USD' THEN amount
               ELSE (metadata->>'amountUsd')::numeric
          END
        ), 0) AS total
       FROM public.wallet_transactions
       WHERE user_id = $1
         AND type = 'withdrawal'
         AND status != 'failed'
         AND created_at >= NOW() - INTERVAL '24 hours'`,
      [userId]
    );
    const spentToday = Number(dailyTotal?.total || 0);
    if (spentToday + amountUsd > DAILY_WITHDRAWAL_LIMIT_USD) {
      const remaining = Math.max(0, DAILY_WITHDRAWAL_LIMIT_USD - spentToday);
      return res.status(429).json({
        success: false,
        message: `Daily withdrawal limit reached. You can withdraw up to $${remaining.toFixed(2)} more today.`,
        code: 'DAILY_LIMIT_EXCEEDED',
      });
    }

    const reference = `BAGO-WD-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Atomically deduct — WHERE available_balance >= amount prevents overdraft race
    const updatedWallet = await queryOne(
      `UPDATE public.wallet_accounts
       SET available_balance = available_balance - $2, updated_at = NOW()
       WHERE user_id = $1 AND available_balance >= $2
       RETURNING available_balance`,
      [userId, amount]
    );
    if (!updatedWallet) {
      return res.status(400).json({ success: false, message: 'Insufficient balance' });
    }

    // Record as pending_admin_approval — admin must approve before payout API is called
    await pgQuery(
      `INSERT INTO public.wallet_transactions
        (wallet_id, user_id, type, amount, currency, status, description, metadata)
       VALUES ($1, $2, 'withdrawal', $3, $4, 'pending_admin_approval', $5, $6)`,
      [
        account.wallet_id, userId, amount, walletCurrency,
        `Withdrawal via ${selectedMethod === 'bank' ? 'Bank Transfer' : 'Stripe Connect'}`,
        JSON.stringify({
          method: selectedMethod,
          provider: selectedMethod === 'bank' ? 'paystack' : 'stripe',
          amountUsd,
          reference,
          requestedAmount: Number(amount),
          withdrawalFee,
          payoutAmount,
          feeCurrency: walletCurrency,
          feeRule: selectedMethod === 'bank' ? 'paystack_ngn_200' : 'stripe_connect',
          recipientCode: account.paystack_recipient_code,
        }),
      ]
    );

    const userName = [account.first_name, account.last_name].filter(Boolean).join(' ').trim();
    await sendWithdrawalSubmittedEmail(
      account.email,
      userName,
      {
        amount: Number(amount),
        currency: walletCurrency,
        reference,
        method: selectedMethod === 'bank' ? 'bank account' : 'Stripe Connect',
      },
    ).catch(() => {});

    // Notify admins
    listActiveAdminEmails().then((emails) => {
      for (const email of emails) {
        sendWithdrawalAdminNotification(email, {
          userName,
          userEmail: account.email,
          amount: Number(amount),
          currency: walletCurrency,
          method: selectedMethod === 'bank' ? 'Bank Transfer (Paystack)' : 'Stripe Connect',
          reference,
        }).catch(() => {});
      }
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted. An admin will review and process it shortly.',
      reference,
      requestedAmount: Number(amount),
      withdrawalFee,
      payoutAmount,
      balance: updatedWallet.available_balance,
    });
  } catch (error) {
    console.error('withdrawFunds error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      code: error.code,
      message: error.message,
    });
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
