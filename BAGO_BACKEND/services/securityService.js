/**
 * Anti-abuse and duplicate-account protection service.
 * All security checks that gate access to Dojah KYC live here.
 */

import { query, queryOne } from '../lib/postgres/db.js';
import { sendSecurityFlagNotification } from './emailNotifications.js';
import { listActiveAdminEmails } from '../lib/postgres/trips.js';

// ─── Name validation ──────────────────────────────────────────────────────────

const FAKE_NAMES = new Set([
  'user', 'users', 'test', 'tester', 'testing', 'admin', 'administrator',
  'bago', 'bag', 'donation', 'donationbag', 'name', 'fullname', 'full name',
  'unknown', 'anonymous', 'guest', 'null', 'undefined', 'none', 'n/a', 'na',
  'customer', 'client', 'account', 'profile', 'sample', 'demo', 'fake',
  'lorem', 'ipsum', 'abc', 'xyz', 'asdf', 'qwerty', 'hello', 'world',
]);

const EMOJI_RE    = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u;
const NUMBERS_RE  = /\d/;
const ONLY_LETTERS_RE = /^[a-zA-ZÀ-ÖØ-öø-ÿ'\-\s]+$/;

export function validateLegalName(rawName = '') {
  const name = rawName.trim().replace(/\s+/g, ' ');
  if (!name) return { valid: false, reason: 'Name is required' };
  if (EMOJI_RE.test(name)) return { valid: false, reason: 'Name cannot contain emojis' };
  if (NUMBERS_RE.test(name)) return { valid: false, reason: 'Name cannot contain numbers' };
  if (!ONLY_LETTERS_RE.test(name)) return { valid: false, reason: 'Name contains invalid characters' };

  const parts = name.split(' ').filter(Boolean);
  if (parts.length < 2) return { valid: false, reason: 'Please enter both first name and last name' };
  if (parts.some((p) => p.length < 2)) return { valid: false, reason: 'Each name part must be at least 2 characters' };
  if (name.length < 5) return { valid: false, reason: 'Name is too short' };

  const lower = name.toLowerCase();
  if (FAKE_NAMES.has(lower) || parts.some((p) => FAKE_NAMES.has(p.toLowerCase()))) {
    return { valid: false, reason: 'Please enter your real legal name' };
  }

  // Detect repeated character patterns (aaaa, bbbb)
  if (/(.)\1{3,}/.test(lower)) return { valid: false, reason: 'Name does not look valid' };

  // Detect username patterns (underscores, dots as separators)
  if (/[_.]/.test(name)) return { valid: false, reason: 'Name cannot contain underscores or dots' };

  return { valid: true, normalized: name };
}

export function normalizeName(first = '', last = '') {
  return `${first} ${last}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ─── Client IP extraction ─────────────────────────────────────────────────────

export function extractIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim().replace(/^::ffff:/, '');
  return (req.socket?.remoteAddress || req.ip || '').replace(/^::ffff:/, '');
}

// ─── Suspicious email detection ───────────────────────────────────────────────

const TEMP_MAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'spam4.me', 'trashmail.com', 'dispostable.com',
  'maildrop.cc', 'mailnull.com', 'spamgourmet.com', 'fakeinbox.com',
  'mailnesia.com', 'discard.email', 'spamex.com', 'getairmail.com',
  'getnada.com', 'moakt.com', 'tempr.email', '10minutemail.com',
  'minutemail.com', 'temp-mail.org', 'throwam.com',
]);

export function emailRiskScore(email = '') {
  const lower = email.toLowerCase().trim();
  const [local, domain] = lower.split('@');
  if (!domain) return 20;

  let score = 0;
  if (TEMP_MAIL_DOMAINS.has(domain)) score += 40;
  // Lots of numbers in local part (e.g. user123456@gmail.com)
  const digits = (local.match(/\d/g) || []).length;
  if (digits >= 6) score += 20;
  // Many dots (e.g. a.b.c.d.e@gmail.com)
  if ((local.match(/\./g) || []).length >= 3) score += 15;
  return score;
}

// ─── Banned list checks (hard blocks) ────────────────────────────────────────

export async function checkHardBans({ ip, deviceFp, normalizedName, googleSub, phone, email }) {
  const signals = [];

  // IP ban
  if (ip) {
    const row = await queryOne(
      `SELECT ip_address FROM public.banned_ips WHERE ip_address = $1 LIMIT 1`,
      [ip],
    ).catch(() => null);
    if (row) signals.push('banned_ip');
  }

  // Device fingerprint ban
  if (deviceFp) {
    const row = await queryOne(
      `SELECT fingerprint FROM public.banned_device_fingerprints WHERE fingerprint = $1 LIMIT 1`,
      [deviceFp],
    ).catch(() => null);
    if (row) signals.push('banned_device');
  }

  // Name ban
  if (normalizedName) {
    const row = await queryOne(
      `SELECT normalized FROM public.banned_names WHERE normalized = $1 LIMIT 1`,
      [normalizedName],
    ).catch(() => null);
    if (row) signals.push('banned_name');
  }

  // Check if any banned account shares this Google sub, phone, or email
  if (googleSub || phone || email) {
    const parts = [];
    const params = [];
    let idx = 1;
    if (googleSub) { parts.push(`google_sub = $${idx++}`); params.push(googleSub); }
    if (phone)     { parts.push(`phone = $${idx++}`);      params.push(phone); }
    if (email)     { parts.push(`lower(email) = $${idx++}`); params.push(email.toLowerCase()); }

    if (parts.length) {
      const row = await queryOne(
        `SELECT id FROM public.profiles WHERE banned = TRUE AND (${parts.join(' OR ')}) LIMIT 1`,
        params,
      ).catch(() => null);
      if (row) signals.push('banned_account_match');
    }
  }

  return signals;
}

// ─── Risk scoring ─────────────────────────────────────────────────────────────

export async function calculateRiskScore({
  userId,
  ip,
  deviceFp,
  googleSub,
  phone,
  firstName,
  lastName,
  email,
}) {
  let score = 0;
  const signals = [];

  // Same device fingerprint used by 2+ other accounts in last 30 days
  if (deviceFp) {
    const row = await queryOne(
      `SELECT COUNT(*) AS cnt FROM public.profiles
       WHERE device_fingerprint = $1 AND id != $2
         AND created_at > NOW() - INTERVAL '30 days'`,
      [deviceFp, userId || '00000000-0000-0000-0000-000000000000'],
    ).catch(() => null);
    const cnt = parseInt(row?.cnt || 0);
    // Reduced: shared devices are common (family/office). Only flag high count.
    if (cnt >= 3) { score += 35; signals.push(`device_used_by_${cnt}_accounts`); }
    else if (cnt >= 1) { score += 10; signals.push('device_shared'); }
  }

  // Google OAuth sub already on another account
  if (googleSub) {
    const row = await queryOne(
      `SELECT id FROM public.profiles WHERE google_sub = $1 AND id != $2 LIMIT 1`,
      [googleSub, userId || '00000000-0000-0000-0000-000000000000'],
    ).catch(() => null);
    if (row) { score += 40; signals.push('google_sub_duplicate'); }
  }

  // Phone already on another account
  if (phone) {
    const row = await queryOne(
      `SELECT id FROM public.profiles WHERE phone = $1 AND id != $2 LIMIT 1`,
      [phone, userId || '00000000-0000-0000-0000-000000000000'],
    ).catch(() => null);
    if (row) { score += 40; signals.push('phone_duplicate'); }
  }

  // IP created 5+ accounts in the past 24 hours (raised from 3 — hotspots/offices are common)
  if (ip) {
    const row = await queryOne(
      `SELECT COUNT(*) AS cnt FROM public.profiles
       WHERE signup_ip = $1 AND created_at > NOW() - INTERVAL '24 hours'`,
      [ip],
    ).catch(() => null);
    const cnt = parseInt(row?.cnt || 0);
    if (cnt >= 5) { score += 20; signals.push(`ip_${cnt}_accounts_24h`); }
  }

  // Fuzzy name match against banned_names (Damerau–Levenshtein via pg_trgm)
  if (firstName && lastName) {
    const normalized = normalizeName(firstName, lastName);
    const row = await queryOne(
      `SELECT normalized, similarity(normalized, $1) AS sim
       FROM public.banned_names
       WHERE similarity(normalized, $1) > 0.85
       ORDER BY sim DESC LIMIT 1`,
      [normalized],
    ).catch(() => null);
    if (row) { score += 30; signals.push(`name_similar_to_banned:${row.normalized}`); }
  }

  // Suspicious email (temp mail domains only — removed number/dot scoring, too many false positives)
  const emailScore = emailRiskScore(email || '');
  if (emailScore >= 40) { score += emailScore; signals.push(`email_suspicious:${emailScore}`); }

  // User has already attempted KYC today (rate limit signal)
  if (userId) {
    const row = await queryOne(
      `SELECT kyc_attempt_count, last_kyc_attempt_at FROM public.profiles WHERE id = $1`,
      [userId],
    ).catch(() => null);
    if (row?.last_kyc_attempt_at) {
      const hoursSince = (Date.now() - new Date(row.last_kyc_attempt_at).getTime()) / 3600000;
      if (hoursSince < 24 && (row.kyc_attempt_count || 0) >= 2) {
        score += 15; signals.push('kyc_repeated_today');
      }
    }
  }

  return { score, signals };
}

// ─── Rate limiting ────────────────────────────────────────────────────────────

export async function checkSignupRateLimit(ip) {
  if (!ip) return { limited: false };
  const row = await queryOne(
    `INSERT INTO public.signup_rate_limits (ip_address, attempt_date, attempt_count)
     VALUES ($1, CURRENT_DATE, 1)
     ON CONFLICT (ip_address, attempt_date)
     DO UPDATE SET attempt_count = signup_rate_limits.attempt_count + 1
     RETURNING attempt_count`,
    [ip],
  ).catch(() => null);
  const count = parseInt(row?.attempt_count || 0);
  return { limited: count > 3, count };
}

export async function checkKycRateLimit({ userId, deviceFp }) {
  if (!userId) return { limited: false };

  // Per-user: max 10 KYC attempts per day
  const userRow = await queryOne(
    `SELECT kyc_attempt_count, last_kyc_attempt_at FROM public.profiles WHERE id = $1`,
    [userId],
  ).catch(() => null);

  if (userRow?.last_kyc_attempt_at) {
    const hoursSince = (Date.now() - new Date(userRow.last_kyc_attempt_at).getTime()) / 3600000;
    if (hoursSince < 24 && (userRow.kyc_attempt_count || 0) >= 10) {
      return { limited: true, reason: 'user_kyc_limit', count: userRow.kyc_attempt_count };
    }
  }

  // Per-device: max 3 KYC attempts per day
  if (deviceFp) {
    const deviceRow = await queryOne(
      `SELECT COUNT(*) AS cnt FROM public.security_events
       WHERE device_fp = $1
         AND event_type = 'kyc_start'
         AND created_at > NOW() - INTERVAL '24 hours'`,
      [deviceFp],
    ).catch(() => null);
    const cnt = parseInt(deviceRow?.cnt || 0);
    if (cnt >= 3) {
      return { limited: true, reason: 'device_kyc_limit', count: cnt };
    }
  }

  return { limited: false };
}

// ─── Security event logging ───────────────────────────────────────────────────

export async function logSecurityEvent({
  userId,
  eventType,
  action,
  riskScore,
  riskSignals,
  reasonCode,
  ip,
  deviceFp,
  userAgent,
  metadata = {},
  adminId = null,
}) {
  await query(
    `INSERT INTO public.security_events
       (user_id, event_type, action, risk_score, risk_signals, reason_code,
        ip_address, device_fp, user_agent, metadata, admin_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      userId || null,
      eventType,
      action,
      riskScore ?? null,
      riskSignals ? JSON.stringify(riskSignals) : null,
      reasonCode || null,
      ip || null,
      deviceFp || null,
      userAgent || null,
      JSON.stringify(metadata),
      adminId || null,
    ],
  ).catch((err) => console.error('logSecurityEvent failed:', err.message));
}

// ─── Full pre-KYC gate ────────────────────────────────────────────────────────

const BLOCKED_MSG =
  'Your account cannot proceed with verification at this time. ' +
  'Due to our internal security and compliance policy, we are unable to allow this account to proceed. ' +
  'If you believe this is a mistake, please contact support@sendwithbago.com.';

const REVIEW_MSG =
  'Your account is currently under review. ' +
  'We will notify you by email once the review is complete.';

const REVIEW_COOLDOWN_MINUTES = Number(process.env.KYC_REVIEW_COOLDOWN_MINUTES || 30);

const reviewRetryMessage = (minutes = REVIEW_COOLDOWN_MINUTES) =>
  `We need a little more time before verification can continue. Please try again in about ${minutes} minutes.`;

/**
 * Run all pre-KYC checks. Returns { allowed, status, message } or throws.
 * `status` is one of: 'allowed' | 'pending_name' | 'pending_security_review' | 'blocked'
 */
export async function runPreKycChecks(user, req) {
  const ip       = extractIp(req);
  const deviceFp = (req.headers['x-device-fingerprint'] || '').trim() || user.deviceFingerprint;
  const userAgent = (req.headers['user-agent'] || '').slice(0, 300);
  const profile = await queryOne(
    `SELECT account_status AS "accountStatus", banned, is_flagged AS "isFlagged",
            flag_source AS "flagSource", flagged_at AS "flaggedAt"
     FROM public.profiles WHERE id = $1`,
    [user.id],
  ).catch(() => null);
  const userStatus = profile?.accountStatus || user.accountStatus || user.account_status || 'active';
  const userBanned = Boolean(profile?.banned ?? user.banned);
  let releasedAutoReview = false;

  // 1. Account status gate
  if (userStatus === 'banned' || userBanned) {
    await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'block', reasonCode: 'account_banned', ip, deviceFp, userAgent });
    return { allowed: false, status: 'blocked', message: BLOCKED_MSG };
  }
  if (userStatus === 'rejected') {
    await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'block', reasonCode: 'account_rejected', ip, deviceFp, userAgent });
    return { allowed: false, status: 'blocked', message: BLOCKED_MSG };
  }
  if (userStatus === 'pending_security_review') {
    const flaggedAt = profile?.flaggedAt ? new Date(profile.flaggedAt) : null;
    const minutesSinceFlag = flaggedAt ? (Date.now() - flaggedAt.getTime()) / 60000 : 0;
    const autoFlag = (profile?.flagSource || 'auto_flag') === 'auto_flag';
    if (autoFlag && minutesSinceFlag >= REVIEW_COOLDOWN_MINUTES) {
      releasedAutoReview = true;
      await query(
        `UPDATE public.profiles
         SET account_status = 'active',
             flag_reason = COALESCE(flag_reason, '') || ' | Auto-review cooldown elapsed; KYC retry allowed.',
             updated_at = NOW()
         WHERE id = $1 AND account_status = 'pending_security_review' AND banned IS DISTINCT FROM TRUE`,
        [user.id],
      ).catch(() => {});
      await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'allow', reasonCode: 'auto_review_cooldown_elapsed', ip, deviceFp, userAgent });
    } else {
      const retryIn = Math.max(1, Math.ceil(REVIEW_COOLDOWN_MINUTES - minutesSinceFlag));
      await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'cooldown', reasonCode: 'pending_review_cooldown', ip, deviceFp, userAgent, metadata: { retryInMinutes: retryIn } });
      return {
        allowed: false,
        status: 'pending_security_review',
        message: reviewRetryMessage(retryIn),
        retryAfterMinutes: retryIn,
      };
    }
  }

  // 2. Legal name check
  const firstName = user.firstName || user.first_name || '';
  const lastName  = user.lastName  || user.last_name  || '';
  const nameCheck = validateLegalName(`${firstName} ${lastName}`.trim());
  if (!nameCheck.valid) {
    await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'block', reasonCode: 'name_invalid', ip, deviceFp, userAgent, metadata: { nameReason: nameCheck.reason } });
    return { allowed: false, status: 'pending_name', message: nameCheck.reason, nameRequired: true };
  }

  // 3. KYC rate limit
  const rateLimit = await checkKycRateLimit({ userId: user.id, deviceFp });
  if (rateLimit.limited) {
    await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'block', reasonCode: rateLimit.reason, ip, deviceFp, userAgent });
    return {
      allowed: false,
      status: 'blocked',
      message: 'You have reached the maximum number of verification attempts for today. Please try again tomorrow.',
    };
  }

  // 4. Hard ban checks — flag for admin review instead of auto-banning
  const normalizedName = normalizeName(firstName, lastName);
  const hardBans = await checkHardBans({
    ip,
    deviceFp,
    normalizedName,
    googleSub: user.googleSub || user.google_sub,
    phone:     user.phone,
    email:     user.email,
  });
  if (hardBans.length > 0 && !releasedAutoReview) {
    const flagReason = `Auto-flagged: matched ban criteria (${hardBans.join(', ')})`;
    await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'cooldown', reasonCode: 'hard_ban_match', riskSignals: hardBans, ip, deviceFp, userAgent, metadata: { retryAfterMinutes: REVIEW_COOLDOWN_MINUTES } });
    await query(
      `UPDATE public.profiles
       SET is_flagged       = TRUE,
           flag_reason      = $2,
           flag_source      = 'auto_flag',
           flagged_at       = COALESCE(flagged_at, NOW()),
           account_status   = 'pending_security_review',
           updated_at       = NOW()
       WHERE id = $1`,
      [user.id, flagReason],
    ).catch(() => {});
    // Notify admins so they can review rather than the system deciding
    listActiveAdminEmails().then((emails) => {
      for (const email of emails) {
        sendSecurityFlagNotification(email, {
          userName:  `${firstName} ${lastName}`.trim(),
          userEmail: user.email,
          reason:    flagReason,
          signals:   hardBans,
        }).catch(() => {});
      }
    }).catch(() => {});
    return {
      allowed: false,
      status: 'pending_security_review',
      message: reviewRetryMessage(),
      retryAfterMinutes: REVIEW_COOLDOWN_MINUTES,
    };
  }

  // 5. Risk scoring — raised thresholds to reduce false positives
  const { score, signals } = await calculateRiskScore({
    userId:    user.id,
    ip,
    deviceFp,
    googleSub: user.googleSub || user.google_sub,
    phone:     user.phone,
    firstName,
    lastName,
    email:     user.email,
  });

  // Persist updated risk score on the profile
  await query(
    `UPDATE public.profiles SET risk_score = $1, risk_signals = $2, updated_at = NOW() WHERE id = $3`,
    [score, JSON.stringify({ score, signals, updatedAt: new Date().toISOString() }), user.id],
  ).catch(() => {});

  // Score ≥ 90: strong indicators (Google sub duplicate, phone duplicate, many device accounts)
  if (score >= 90 && !releasedAutoReview) {
    await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'cooldown', riskScore: score, riskSignals: signals, reasonCode: 'risk_score_high', ip, deviceFp, userAgent, metadata: { retryAfterMinutes: REVIEW_COOLDOWN_MINUTES } });
    await query(
      `UPDATE public.profiles SET account_status = 'pending_security_review',
         is_flagged = TRUE, flag_reason = $2, flag_source = 'auto_flag',
         flagged_at = COALESCE(flagged_at, NOW()), updated_at = NOW()
       WHERE id = $1 AND account_status = 'active'`,
      [user.id, `Auto-flagged: high risk score ${score} (${signals.slice(0, 3).join(', ')})`],
    ).catch(() => {});
    listActiveAdminEmails().then((emails) => {
      for (const email of emails) {
        sendSecurityFlagNotification(email, {
          userName:  `${firstName} ${lastName}`.trim(),
          userEmail: user.email,
          reason:    `High risk score: ${score}`,
          signals,
        }).catch(() => {});
      }
    }).catch(() => {});
    return {
      allowed: false,
      status: 'pending_security_review',
      message: reviewRetryMessage(),
      retryAfterMinutes: REVIEW_COOLDOWN_MINUTES,
    };
  }

  // Score 65–89: elevated but not conclusive — flag for admin review, allow KYC to proceed
  if (score >= 65) {
    await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'review', riskScore: score, riskSignals: signals, reasonCode: 'risk_score_medium', ip, deviceFp, userAgent });
    await query(
      `UPDATE public.profiles
         SET is_flagged = TRUE, flag_reason = $2, flag_source = 'auto_flag',
             flagged_at = COALESCE(flagged_at, NOW()), updated_at = NOW()
       WHERE id = $1 AND is_flagged IS DISTINCT FROM TRUE`,
      [user.id, `Auto-flagged: elevated risk score ${score} (${signals.slice(0, 3).join(', ')})`],
    ).catch(() => {});
    listActiveAdminEmails().then((emails) => {
      for (const email of emails) {
        sendSecurityFlagNotification(email, {
          userName:  `${firstName} ${lastName}`.trim(),
          userEmail: user.email,
          reason:    `Elevated risk score: ${score}`,
          signals,
        }).catch(() => {});
      }
    }).catch(() => {});
    // Allow KYC to continue — admin will review the submitted result
  }

  // 6. All clear
  await logSecurityEvent({ userId: user.id, eventType: 'kyc_start', action: 'allow', riskScore: score, riskSignals: signals, ip, deviceFp, userAgent });

  // Increment KYC attempt counter
  await query(
    `UPDATE public.profiles
     SET kyc_attempt_count = CASE
           WHEN last_kyc_attempt_at < NOW() - INTERVAL '24 hours' THEN 1
           ELSE COALESCE(kyc_attempt_count, 0) + 1
         END,
         last_kyc_attempt_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [user.id],
  ).catch(() => {});

  return { allowed: true, status: 'allowed', riskScore: score };
}
