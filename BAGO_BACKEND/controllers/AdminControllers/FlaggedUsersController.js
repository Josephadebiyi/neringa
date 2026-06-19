import { query, queryOne } from '../../lib/postgres/db.js';

// GET /admin/flagged-users
export const getFlaggedUsers = async (req, res) => {
  try {
    const { page = 1, limit = 50, source } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [
      `(p.is_flagged = TRUE OR p.kyc_status = 'blocked_duplicate' OR p.banned = TRUE)`,
    ];
    const params = [];
    let idx = 1;

    if (source) {
      conditions.push(`p.flag_source = $${idx++}`);
      params.push(source);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT
         p.id,
         p.first_name         AS "firstName",
         p.last_name          AS "lastName",
         p.email,
         p.phone,
         p.country,
         p.banned,
         p.status,
         p.is_flagged         AS "isFlagged",
         p.flag_reason        AS "flagReason",
         p.flag_source        AS "flagSource",
         p.flagged_at         AS "flaggedAt",
         p.kyc_status         AS "kycStatus",
         p.kyc_provider       AS "kycProvider",
         p.kyc_failure_reason AS "kycFailureReason",
         p.verified_full_legal_name AS "verifiedFullLegalName",
         p.verified_date_of_birth   AS "verifiedDateOfBirth",
         p.device_fingerprint AS "deviceFingerprint",
         p.image_url          AS "profileImage",
         p.created_at         AS "createdAt"
       FROM public.profiles p
       ${where}
       ORDER BY p.flagged_at DESC NULLS LAST, p.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, Number(limit), offset],
    );

    const countRow = await queryOne(
      `SELECT COUNT(*) FROM public.profiles p ${where}`,
      params,
    );

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: parseInt(countRow.count),
        pages: Math.ceil(parseInt(countRow.count) / Number(limit)),
      },
    });
  } catch (err) {
    console.error('getFlaggedUsers error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /admin/users/:userId/flag
export const flagUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, source = 'admin' } = req.body;

    const user = await queryOne(
      `UPDATE public.profiles
       SET is_flagged  = TRUE,
           flag_reason = COALESCE($2, flag_reason),
           flag_source = COALESCE($3, flag_source),
           flagged_at  = COALESCE(flagged_at, NOW()),
           updated_at  = NOW()
       WHERE id = $1
       RETURNING id, email, first_name AS "firstName", last_name AS "lastName"`,
      [userId, reason || null, source],
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'User flagged', data: user });
  } catch (err) {
    console.error('flagUser error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /admin/users/:userId/unflag  — allow the user, clear flag
export const unflagUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await queryOne(
      `UPDATE public.profiles
       SET is_flagged  = FALSE,
           flag_reason = NULL,
           flag_source = NULL,
           flagged_at  = NULL,
           kyc_status  = CASE WHEN kyc_status = 'blocked_duplicate' THEN 'approved' ELSE kyc_status END,
           updated_at  = NOW()
       WHERE id = $1
       RETURNING id, email, first_name AS "firstName", last_name AS "lastName"`,
      [userId],
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, message: 'Flag cleared — user allowed', data: user });
  } catch (err) {
    console.error('unflagUser error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// POST /admin/users/:userId/ban-with-device
// Bans the user AND adds their device fingerprint to the banned list so new accounts from the same device are auto-flagged
export const banWithDevice = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Admin ban' } = req.body;

    const user = await queryOne(
      `UPDATE public.profiles
       SET banned      = TRUE,
           is_flagged  = TRUE,
           flag_reason = $2,
           flag_source = 'admin_ban',
           flagged_at  = COALESCE(flagged_at, NOW()),
           updated_at  = NOW()
       WHERE id = $1
       RETURNING id, email, device_fingerprint AS "deviceFingerprint"`,
      [userId, reason],
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.deviceFingerprint) {
      await query(
        `INSERT INTO public.banned_device_fingerprints (fingerprint, banned_user_id, reason)
         VALUES ($1, $2, $3)
         ON CONFLICT (fingerprint) DO NOTHING`,
        [user.deviceFingerprint, userId, reason],
      ).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'User banned' + (user.deviceFingerprint ? ' and device fingerprint blocked' : ' (no device fingerprint stored)'),
      data: { userId: user.id, email: user.email, deviceBanned: !!user.deviceFingerprint },
    });
  } catch (err) {
    console.error('banWithDevice error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
