import { query, queryOne } from '../../lib/postgres/db.js';
import { sendAccountBannedEmail } from '../../services/emailNotifications.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const normalizeFullName = (first = '', last = '') =>
  `${first} ${last}`.toLowerCase().replace(/\s+/g, ' ').trim();

const getClientIp = (req) => {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return (req.socket?.remoteAddress || req.ip || '').replace(/^::ffff:/, '');
};

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

// ─── Internal: apply ban to one profile row and send email ───────────────────
async function applyBanToUser(userId, reason, { sendEmail = true } = {}) {
  const user = await queryOne(
    `UPDATE public.profiles
     SET banned      = TRUE,
         is_flagged  = TRUE,
         flag_reason = COALESCE($2, flag_reason),
         flag_source = 'auto_ban',
         flagged_at  = COALESCE(flagged_at, NOW()),
         updated_at  = NOW()
     WHERE id = $1 AND banned = FALSE
     RETURNING id, email,
               first_name AS "firstName", last_name AS "lastName",
               device_fingerprint AS "deviceFingerprint",
               signup_ip AS "signupIp", last_login_ip AS "lastLoginIp"`,
    [userId, reason],
  );
  if (!user) return null; // already banned or not found

  if (sendEmail && user.email) {
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'there';
    sendAccountBannedEmail(user.email, name, reason).catch(() => {});
  }
  return user;
}

// ─── Internal: register identifiers in ban tables ─────────────────────────────
async function registerBanIdentifiers(userId, { name, signupIp, lastLoginIp, deviceFingerprint, reason }) {
  const tasks = [];

  if (name) {
    tasks.push(
      query(
        `INSERT INTO public.banned_names (full_name, normalized, banned_user_id, reason)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (normalized) DO NOTHING`,
        [name.toUpperCase(), name.toLowerCase(), userId, reason],
      ).catch(() => {}),
    );
  }

  for (const ip of [signupIp, lastLoginIp].filter(Boolean)) {
    tasks.push(
      query(
        `INSERT INTO public.banned_ips (ip_address, banned_user_id, reason)
         VALUES ($1, $2, $3)
         ON CONFLICT (ip_address) DO NOTHING`,
        [ip, userId, reason],
      ).catch(() => {}),
    );
  }

  if (deviceFingerprint) {
    tasks.push(
      query(
        `INSERT INTO public.banned_device_fingerprints (fingerprint, banned_user_id, reason)
         VALUES ($1, $2, $3)
         ON CONFLICT (fingerprint) DO NOTHING`,
        [deviceFingerprint, userId, reason],
      ).catch(() => {}),
    );
  }

  await Promise.allSettled(tasks);
}

// POST /admin/users/:userId/ban-with-device
// Comprehensive ban: blocks by device fingerprint, full name, AND IP address.
// Scans all existing users for matches and auto-bans them with an email notification.
export const banWithDevice = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Violation of Bago Terms of Service' } = req.body;

    // 1. Load the primary user's identifiers before banning
    const profile = await queryOne(
      `SELECT id, email,
              first_name AS "firstName", last_name AS "lastName",
              device_fingerprint AS "deviceFingerprint",
              signup_ip AS "signupIp", last_login_ip AS "lastLoginIp"
       FROM public.profiles WHERE id = $1`,
      [userId],
    );
    if (!profile) return res.status(404).json({ success: false, message: 'User not found' });

    // 2. Ban the primary account and send email
    await applyBanToUser(userId, reason, { sendEmail: true });

    // Ensure the user is marked banned even if already banned
    await query(
      `UPDATE public.profiles
       SET banned = TRUE, is_flagged = TRUE,
           flag_reason = COALESCE(flag_reason, $2),
           flag_source = COALESCE(flag_source, 'admin_ban'),
           flagged_at  = COALESCE(flagged_at, NOW()),
           updated_at  = NOW()
       WHERE id = $1`,
      [userId, reason],
    );

    // Send ban email to the primary user if not already sent
    if (profile.email) {
      const name = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'there';
      sendAccountBannedEmail(profile.email, name, reason).catch(() => {});
    }

    const normalizedName = normalizeFullName(profile.firstName, profile.lastName);

    // 3. Register all identifiers in ban tables
    await registerBanIdentifiers(userId, {
      name: normalizedName,
      signupIp:        profile.signupIp,
      lastLoginIp:     profile.lastLoginIp,
      deviceFingerprint: profile.deviceFingerprint,
      reason,
    });

    // 4. Scan existing users for matching name, IPs, or device fingerprint
    const matchConditions = [];
    const matchParams = [userId]; // $1 = exclude self
    let pIdx = 2;

    if (normalizedName) {
      matchConditions.push(
        `lower(concat_ws(' ', first_name, last_name)) = $${pIdx++}`,
      );
      matchParams.push(normalizedName);
    }

    const ipsToCheck = [profile.signupIp, profile.lastLoginIp].filter(Boolean);
    if (ipsToCheck.length) {
      matchConditions.push(`(signup_ip = ANY($${pIdx}) OR last_login_ip = ANY($${pIdx}))`);
      matchParams.push(ipsToCheck);
      pIdx++;
    }

    if (profile.deviceFingerprint) {
      matchConditions.push(`device_fingerprint = $${pIdx++}`);
      matchParams.push(profile.deviceFingerprint);
    }

    const linkedAccounts = [];

    if (matchConditions.length > 0) {
      const matches = await query(
        `SELECT id, email,
                first_name AS "firstName", last_name AS "lastName",
                signup_ip AS "signupIp", last_login_ip AS "lastLoginIp",
                device_fingerprint AS "deviceFingerprint",
                banned
         FROM public.profiles
         WHERE id != $1
           AND (${matchConditions.join(' OR ')})`,
        matchParams,
      );

      for (const match of matches.rows) {
        const matchReason = `Account linked to permanently banned user — created multiple accounts. ${reason}`;
        const banned = await applyBanToUser(match.id, matchReason, { sendEmail: true });

        // Register their identifiers too
        await registerBanIdentifiers(match.id, {
          name: normalizeFullName(match.firstName, match.lastName),
          signupIp:    match.signupIp,
          lastLoginIp: match.lastLoginIp,
          deviceFingerprint: match.deviceFingerprint,
          reason: matchReason,
        });

        linkedAccounts.push({
          userId: match.id,
          email:  match.email,
          name:   [match.firstName, match.lastName].filter(Boolean).join(' '),
          alreadyBanned: match.banned,
          newlyBanned: !!banned,
        });
      }
    }

    return res.json({
      success: true,
      message: `User permanently banned. ${linkedAccounts.length} linked account(s) also banned.`,
      data: {
        userId:          profile.id,
        email:           profile.email,
        nameBanned:      !!normalizedName,
        ipsBanned:       ipsToCheck,
        deviceBanned:    !!profile.deviceFingerprint,
        linkedAccounts,
      },
    });
  } catch (err) {
    console.error('banWithDevice error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
