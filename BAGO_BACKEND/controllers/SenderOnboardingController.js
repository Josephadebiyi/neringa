import { query, queryOne } from '../lib/postgres/db.js';
import { findProfileById } from '../lib/postgres/profiles.js';
import { createAuditLog } from '../lib/postgres/audit.js';
import twilio from 'twilio';

const CURRENT_TERMS_VERSION = '1.0';

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  return {
    client: twilio(accountSid, authToken),
    fromNumber,
  };
}

// ─── Shipment Terms ──────────────────────────────────────────────────────────

export async function acceptShipmentTerms(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const ua = req.headers['user-agent'] || '';
    const deviceInfo = req.body.deviceInfo || {};
    const version = req.body.version || CURRENT_TERMS_VERSION;

    await query(
      `INSERT INTO public.shipment_terms_acceptances
         (user_id, terms_version, ip_address, user_agent, device_info)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, terms_version) DO UPDATE
         SET accepted_at = NOW(), ip_address = $3, user_agent = $4, device_info = $5`,
      [userId, version, ip, ua, JSON.stringify(deviceInfo)]
    );

    await createAuditLog({
      actorUserId: userId,
      action: 'shipment_rules_accepted',
      targetType: 'terms',
      targetId: null,
      ipAddress: ip,
      userAgent: ua,
      metadata: { version },
    });

    return res.status(200).json({ success: true, message: 'Terms accepted.' });
  } catch (err) {
    console.error('acceptShipmentTerms error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getTermsStatus(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const row = await queryOne(
      `SELECT accepted_at, terms_version FROM public.shipment_terms_acceptances
       WHERE user_id = $1 AND terms_version = $2`,
      [userId, CURRENT_TERMS_VERSION]
    );
    return res.status(200).json({
      success: true,
      accepted: !!row,
      acceptedAt: row?.accepted_at || null,
      version: CURRENT_TERMS_VERSION,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─── Phone Verification (required for new users before sending) ─────────────

export async function sendPhoneVerificationOtp(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { phone } = req.body;

    if (!phone || phone.trim().length < 7) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required.' });
    }

    const user = await findProfileById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.phoneVerified) {
      return res.status(400).json({ success: false, message: 'Phone already verified.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Store OTP in phone_change slot (reuse existing column)
    await query(
      `UPDATE public.profiles
       SET pending_phone              = $2,
           phone_change_otp_code      = $3,
           phone_change_otp_expires_at = $4,
           updated_at                 = NOW()
       WHERE id = $1`,
      [userId, phone.trim(), otp, expiresAt]
    );

    const sms = getTwilioClient();
    if (!sms) {
      return res.status(500).json({
        success: false,
        message: 'SMS verification is not configured. Please set Twilio credentials.',
      });
    }

    await sms.client.messages.create({
      body: `Your Bago verification code is: ${otp}. Expires in 15 minutes.`,
      from: sms.fromNumber,
      to: phone.trim(),
    });

    return res.status(200).json({ success: true, message: 'OTP sent via SMS.' });
  } catch (err) {
    console.error('sendPhoneVerificationOtp error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function verifyPhoneOtp(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required.' });

    const user = await findProfileById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.phoneVerified) {
      return res.status(200).json({ success: true, message: 'Phone already verified.' });
    }

    const row = await queryOne(
      `SELECT pending_phone, phone_change_otp_code, phone_change_otp_expires_at
       FROM public.profiles WHERE id = $1`,
      [userId]
    );

    if (!row?.phone_change_otp_code) {
      return res.status(400).json({ success: false, message: 'No pending phone verification. Please request a new code.' });
    }

    if (new Date(row.phone_change_otp_expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Verification code expired. Please request a new one.' });
    }

    if (row.phone_change_otp_code !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    // Mark phone as verified and clear OTP
    await query(
      `UPDATE public.profiles
       SET phone                       = COALESCE(pending_phone, phone),
           pending_phone               = NULL,
           phone_change_otp_code       = NULL,
           phone_change_otp_expires_at = NULL,
           phone_verified              = TRUE,
           phone_verified_at           = NOW(),
           updated_at                  = NOW()
       WHERE id = $1`,
      [userId]
    );

    await createAuditLog({
      actorUserId: userId,
      action: 'phone_verified',
      targetType: 'user',
      targetId: userId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {},
    });

    return res.status(200).json({ success: true, message: 'Phone number verified successfully.' });
  } catch (err) {
    console.error('verifyPhoneOtp error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─── Item Categories (public read) ───────────────────────────────────────────

export async function getItemCategories(req, res) {
  try {
    const riskLevel = req.query.risk_level;
    const params = [];
    let where = 'WHERE is_active = TRUE';
    if (riskLevel && ['allowed', 'medium', 'prohibited'].includes(riskLevel)) {
      params.push(riskLevel);
      where += ` AND risk_level = $${params.length}`;
    }
    const rows = await query(
      `SELECT id, name, slug, risk_level, description, warning_message,
              display_order, requires_review, max_declared_value
       FROM public.item_categories ${where}
       ORDER BY display_order ASC, name ASC`,
      params
    );
    return res.status(200).json({ success: true, categories: rows.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─── Admin: CRUD for item categories ────────────────────────────────────────

export async function adminListItemCategories(_req, res) {
  try {
    const rows = await query(
      `SELECT * FROM public.item_categories ORDER BY display_order ASC, risk_level, name`
    );
    return res.status(200).json({ success: true, categories: rows.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function adminCreateItemCategory(req, res) {
  try {
    const { name, slug, risk_level, description, warning_message,
            display_order, requires_review, max_declared_value } = req.body;

    if (!name || !slug || !risk_level) {
      return res.status(400).json({ success: false, message: 'name, slug, and risk_level are required.' });
    }
    if (!['allowed', 'medium', 'prohibited'].includes(risk_level)) {
      return res.status(400).json({ success: false, message: 'risk_level must be allowed, medium, or prohibited.' });
    }

    const row = await queryOne(
      `INSERT INTO public.item_categories
         (name, slug, risk_level, description, warning_message, display_order, requires_review, max_declared_value)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [name, slug, risk_level, description || null, warning_message || null,
       display_order || 0, requires_review || false, max_declared_value || null]
    );
    return res.status(201).json({ success: true, category: row });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ success: false, message: 'A category with this slug already exists.' });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function adminUpdateItemCategory(req, res) {
  try {
    const { id } = req.params;
    const { name, slug, risk_level, description, warning_message,
            display_order, requires_review, max_declared_value, is_active } = req.body;

    const row = await queryOne(
      `UPDATE public.item_categories
       SET name               = COALESCE($2, name),
           slug               = COALESCE($3, slug),
           risk_level         = COALESCE($4, risk_level),
           description        = COALESCE($5, description),
           warning_message    = COALESCE($6, warning_message),
           display_order      = COALESCE($7, display_order),
           requires_review    = COALESCE($8, requires_review),
           max_declared_value = COALESCE($9, max_declared_value),
           is_active          = COALESCE($10, is_active),
           updated_at         = NOW()
       WHERE id = $1 RETURNING *`,
      [id, name, slug, risk_level, description, warning_message,
       display_order, requires_review, max_declared_value, is_active]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(200).json({ success: true, category: row });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function adminDeleteItemCategory(req, res) {
  try {
    const { id } = req.params;
    const row = await queryOne(
      `DELETE FROM public.item_categories WHERE id = $1 RETURNING id`, [id]
    );
    if (!row) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.status(200).json({ success: true, message: 'Category deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// ─── Helpers (used by other controllers) ─────────────────────────────────────

export async function checkTermsAccepted(userId) {
  const row = await queryOne(
    `SELECT id FROM public.shipment_terms_acceptances
     WHERE user_id = $1 AND terms_version = $2`,
    [userId, CURRENT_TERMS_VERSION]
  );
  return !!row;
}

export async function getItemCategoryBySlug(slug) {
  return queryOne(
    `SELECT id, name, slug, risk_level, requires_review, max_declared_value, warning_message
     FROM public.item_categories WHERE slug = $1 AND is_active = TRUE`,
    [slug]
  );
}
