import axios from 'axios';
import crypto from 'crypto';
import { query, queryOne } from '../lib/postgres/db.js';
import { markKycApproved } from '../lib/postgres/accounts.js';
import { sendKycApprovedEmail, sendKycSubmittedEmail, sendKycDeclinedEmail } from '../services/emailNotifications.js';
import { sendPushNotification } from '../services/pushNotificationService.js';
import { runPreKycChecks } from '../services/securityService.js';

// ---------------------------------------------------------------------------
// Prembly IdentityForm — backend-only credentials, zero keys on frontend.
// Flow: backend creates session → returns signed URL → frontend opens in
// WebView/iframe → Prembly fires webhook when done.
// ---------------------------------------------------------------------------

const PREMBLY_APP_ID   = process.env.PREMBLY_APP_ID;
const PREMBLY_API_KEY  = process.env.PREMBLY_API_KEY;
const PREMBLY_CONFIG_ID = process.env.PREMBLY_CONFIG_ID; // Widget config ID from Prembly dashboard
const PREMBLY_WIDGET_ID = process.env.PREMBLY_WIDGET_ID;
const PREMBLY_WIDGET_KEY = process.env.PREMBLY_WIDGET_KEY;
const PREMBLY_ENV      = (process.env.PREMBLY_ENVIRONMENT || 'live').toLowerCase();
const PREMBLY_BASE     = 'https://api.prembly.com/identitypass';
const PREMBLY_SDK_SESSION_URL =
  process.env.PREMBLY_SDK_SESSION_URL ||
  'https://backend.prembly.com/api/v1/checker-widget/sdk/sessions/initiate/';
const PREMBLY_SDK_LIVE_URL =
  process.env.PREMBLY_SDK_LIVE_URL ||
  'https://sdk-live.prembly.com/';

// Callback URL Prembly redirects to when the user finishes verification.
// The Flutter WebView and web iframe both watch for this URL to auto-close.
const PREMBLY_CALLBACK_URL = `${process.env.BACKEND_URL || process.env.SERVER_URL || 'https://neringa.onrender.com'}/api/bago/kyc/prembly/complete`;

const premblyHeaders = () => {
  const headers = { 'x-api-key': PREMBLY_API_KEY, 'Content-Type': 'application/json' };
  if (PREMBLY_APP_ID) {
    headers['app_id'] = PREMBLY_APP_ID;
    headers['app-id'] = PREMBLY_APP_ID;
    headers['x-app-id'] = PREMBLY_APP_ID;
  }
  return headers;
};

const isPremblyConfigured = () => !!PREMBLY_API_KEY;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
let sessionTableReady;

// ---------------------------------------------------------------------------
// Webhook status normalisation
// Prembly uses response_code "00" for approved, others for declined/pending.
// ---------------------------------------------------------------------------
const normalizePremblyStatus = (payload = {}) => {
  const responseCode = String(payload?.response_code || payload?.data?.response_code || '').trim();
  const verStatus    = String(
    payload?.data?.verification_response?.status ||
    payload?.data?.verification_status ||
    payload?.data?.status ||
    payload?.data?.result ||
    payload?.verification_status ||
    payload?.verificationStatus ||
    payload?.status ||
    payload?.result ||
    ''
  ).toLowerCase().trim();

  if (responseCode === '00' || ['verified', 'approved', 'success', 'successful', 'completed', 'complete', 'passed', 'pass', 'accepted'].includes(verStatus)) {
    return 'approved';
  }
  if (['pending', 'processing', 'in_progress', 'under_review', 'manual_review', 'submitted', 'review'].includes(verStatus)) {
    return 'pending';
  }
  if (['unverified', 'failed', 'failure', 'declined', 'rejected', 'unsuccessful', 'not_approved'].includes(verStatus) || responseCode === '01') {
    return 'declined';
  }
  return 'unknown';
};

const verificationRefFromPayload = (payload = {}) =>
  payload?.verification_ref ||
  payload?.verificationRef ||
  payload?.reference_id ||
  payload?.referenceId ||
  payload?.data?.verification_ref ||
  payload?.data?.verificationRef ||
  payload?.data?.reference_id ||
  payload?.data?.referenceId ||
  payload?.data?.metadata?.verificationRef ||
  payload?.data?.metadata?.verification_ref ||
  payload?.data?.metadata?.user_ref ||
  payload?.data?.metadata?.userRef ||
  payload?.user_ref ||
  payload?.userRef ||
  '';

const sessionIdFromPayload = (payload = {}) =>
  payload?.session_id ||
  payload?.sessionId ||
  payload?.data?.session_id ||
  payload?.data?.sessionId ||
  payload?.data?.session?.id ||
  payload?.session?.id ||
  '';

const userRefFromPayload = (payload = {}) =>
  payload?.user_ref ||
  payload?.userRef ||
  payload?.data?.user_ref ||
  payload?.data?.userRef ||
  payload?.data?.metadata?.user_ref ||
  payload?.data?.metadata?.userRef ||
  payload?.metadata?.user_ref ||
  payload?.metadata?.userRef ||
  '';

const callbackPayloadFromBody = (body = {}) => {
  const candidates = [
    body?.sdkResponse,
    body?.response,
    body?.payload,
    body?.result,
    body,
  ];
  return candidates.find((candidate) => candidate && typeof candidate === 'object' && !Array.isArray(candidate)) || {};
};

async function ensurePremblySessionTable() {
  sessionTableReady ||= query(`
    CREATE TABLE IF NOT EXISTS public.prembly_kyc_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      verification_ref TEXT,
      prembly_ref TEXT,
      session_id TEXT,
      user_ref TEXT,
      status TEXT NOT NULL DEFAULT 'started',
      source TEXT NOT NULL DEFAULT 'backend',
      verification_url TEXT,
      raw_payload JSONB,
      last_error TEXT,
      last_synced_at TIMESTAMPTZ,
      completed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
    );
    CREATE INDEX IF NOT EXISTS idx_prembly_kyc_sessions_user
      ON public.prembly_kyc_sessions (user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_prembly_kyc_sessions_active
      ON public.prembly_kyc_sessions (status, updated_at DESC)
      WHERE status NOT IN ('approved', 'declined', 'blocked_duplicate');
    CREATE INDEX IF NOT EXISTS idx_prembly_kyc_sessions_refs
      ON public.prembly_kyc_sessions (verification_ref, prembly_ref, session_id, user_ref);
  `).catch((err) => {
    sessionTableReady = null;
    throw err;
  });
  return sessionTableReady;
}

async function recordPremblySession({
  userId,
  verificationRef = '',
  premblyRef = '',
  sessionId = '',
  userRef = '',
  status = 'started',
  source = 'backend',
  verificationUrl = '',
  rawPayload = {},
}) {
  await ensurePremblySessionTable();
  const ref = verificationRef || premblyRef || sessionId || userRef;
  const existing = ref ? await queryOne(
    `SELECT id FROM public.prembly_kyc_sessions
     WHERE user_id = $1::uuid
       AND ($2::text = ''
         OR verification_ref = $2::text
         OR prembly_ref = $2::text
         OR session_id = $2::text
         OR user_ref = $2::text)
     ORDER BY created_at DESC LIMIT 1`,
    [userId, ref],
  ).catch(() => null) : null;

  if (existing?.id) {
    await query(
      `UPDATE public.prembly_kyc_sessions
       SET verification_ref = COALESCE(NULLIF($2::text, ''), verification_ref),
           prembly_ref = COALESCE(NULLIF($3::text, ''), prembly_ref),
           session_id = COALESCE(NULLIF($4::text, ''), session_id),
           user_ref = COALESCE(NULLIF($5::text, ''), user_ref),
           status = COALESCE(NULLIF($6::text, ''), status),
           source = COALESCE(NULLIF($7::text, ''), source),
           verification_url = COALESCE(NULLIF($8::text, ''), verification_url),
           raw_payload = COALESCE($9::jsonb, raw_payload),
           completed_at = CASE WHEN $6::text IN ('approved','declined','blocked_duplicate') THEN timezone('utc', now()) ELSE completed_at END,
           updated_at = timezone('utc', now())
       WHERE id = $1::uuid`,
      [existing.id, verificationRef, premblyRef, sessionId, userRef, status, source, verificationUrl, rawPayload],
    ).catch(() => {});
    return existing.id;
  }

  const inserted = await queryOne(
    `INSERT INTO public.prembly_kyc_sessions
       (user_id, verification_ref, prembly_ref, session_id, user_ref, status, source, verification_url, raw_payload, completed_at)
     VALUES ($1::uuid, NULLIF($2::text, ''), NULLIF($3::text, ''), NULLIF($4::text, ''), NULLIF($5::text, ''), $6::text, $7::text, NULLIF($8::text, ''), $9::jsonb,
             CASE WHEN $6::text IN ('approved','declined','blocked_duplicate') THEN timezone('utc', now()) ELSE NULL END)
     RETURNING id`,
    [userId, verificationRef, premblyRef, sessionId, userRef, status, source, verificationUrl, rawPayload],
  ).catch(() => null);
  return inserted?.id || '';
}

async function activePremblySessionForUser(userId) {
  await ensurePremblySessionTable();
  return queryOne(
    `SELECT id, verification_ref AS "verificationRef", prembly_ref AS "premblyRef",
            session_id AS "sessionId", user_ref AS "userRef", status,
            verification_url AS "verificationUrl", created_at AS "createdAt"
     FROM public.prembly_kyc_sessions
     WHERE user_id = $1
       AND status IN ('started', 'pending', 'processing', 'manual_review')
       AND created_at > timezone('utc', now()) - INTERVAL '30 minutes'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId],
  ).catch(() => null);
}

async function updatePremblySessionStatus(userId, status, rawPayload, { referenceId = '', source = 'sync' } = {}) {
  const sessionId = sessionIdFromPayload(rawPayload);
  const userRef = userRefFromPayload(rawPayload);
  await recordPremblySession({
    userId,
    verificationRef: referenceId,
    premblyRef: referenceId,
    sessionId,
    userRef,
    status,
    source,
    rawPayload,
  }).catch(() => {});
}

async function findPremblyUserId(reference = '') {
  if (!reference) return '';

  await ensurePremblySessionTable().catch(() => {});
  const session = await queryOne(
    `SELECT user_id AS "userId" FROM public.prembly_kyc_sessions
     WHERE verification_ref = $1
        OR prembly_ref = $1
        OR session_id = $1
        OR user_ref = $1
     ORDER BY updated_at DESC LIMIT 1`,
    [reference],
  ).catch(() => null);
  if (session?.userId) return session.userId;

  const row = await queryOne(
    `SELECT id FROM public.profiles
     WHERE kyc_provider = 'prembly'
       AND kyc_verified_data IS NOT NULL
       AND (
         kyc_verified_data->>'verificationRef' = $1
         OR kyc_verified_data->>'premblyRef' = $1
         OR kyc_verified_data->>'referenceId' = $1
         OR kyc_verified_data->>'userRef' = $1
         OR kyc_verified_data->>'userId' = $1
         OR kyc_verified_data#>>'{metadata,user_ref}' = $1
         OR kyc_verified_data#>>'{metadata,userRef}' = $1
         OR kyc_verified_data#>>'{payload,user_ref}' = $1
         OR kyc_verified_data#>>'{payload,userRef}' = $1
         OR kyc_verified_data#>>'{payload,data,metadata,user_ref}' = $1
         OR kyc_verified_data#>>'{payload,data,metadata,userRef}' = $1
       )
     ORDER BY updated_at DESC LIMIT 1`,
    [reference],
  ).catch(() => null);
  if (row?.id) return row.id;

  if (UUID_RE.test(reference)) {
    const profile = await queryOne(
      `SELECT id FROM public.profiles WHERE id = $1 LIMIT 1`,
      [reference],
    ).catch(() => null);
    if (profile?.id) return profile.id;
  }

  const match = reference.match(/^bago-([0-9a-f-]{36})-/i);
  return match?.[1] || '';
}

// ---------------------------------------------------------------------------
// Apply a Prembly result to a user profile — shared by webhook + sync
// ---------------------------------------------------------------------------
async function applyPremblyResult(userId, status, rawPayload, { referenceId = '', notify = true } = {}) {
  const userRow = await queryOne(
    `SELECT email, first_name, last_name FROM public.profiles WHERE id = $1`,
    [userId],
  ).catch(() => null);
  const userEmail = userRow?.email;
  const userName  = [userRow?.first_name, userRow?.last_name].filter(Boolean).join(' ') || 'there';

  const stored = {
    provider: 'prembly',
    referenceId,
    ...(referenceId && { verificationRef: referenceId, premblyRef: referenceId }),
    ...(sessionIdFromPayload(rawPayload) && { sessionId: sessionIdFromPayload(rawPayload) }),
    ...(userRefFromPayload(rawPayload) && { userRef: userRefFromPayload(rawPayload) }),
    payload: rawPayload,
  };

  if (status === 'approved') {
    const approval = await markKycApproved(userId, { provider: 'prembly', kycVerifiedData: stored });
    if (approval?.duplicate) {
      if (notify && userEmail) sendKycDeclinedEmail(userEmail, userName, approval.reason).catch(() => {});
      if (notify) sendPushNotification(userId, 'Verification Not Approved', 'This identity is already linked to another Bago account.', { type: 'kyc_duplicate' }).catch(() => {});
      await updatePremblySessionStatus(userId, 'blocked_duplicate', rawPayload, { referenceId, source: 'apply_result' });
      return { status: 'blocked_duplicate', duplicate: true };
    }

    // Write Prembly-verified name and DOB back to profile so it's locked in
    const vData  = rawPayload?.data || rawPayload?.verification || rawPayload?.response || {};
    const vFirst = (vData.first_name || vData.firstName || '').trim();
    const vLast  = (vData.last_name  || vData.lastName  || '').trim();
    const vDob   = (vData.date_of_birth || vData.dob || vData.dateOfBirth || '').trim();
    const vName  = [vFirst, vLast].filter(Boolean).join(' ');
    if (vFirst || vLast || vDob || vName) {
      await query(
        `UPDATE public.profiles
         SET first_name              = CASE WHEN $2 != '' THEN $2 ELSE first_name END,
             last_name               = CASE WHEN $3 != '' THEN $3 ELSE last_name  END,
             date_of_birth           = CASE WHEN $4 != '' THEN $4::date ELSE date_of_birth END,
             verified_full_legal_name = CASE WHEN $5 != '' THEN $5 ELSE verified_full_legal_name END,
             updated_at = NOW()
         WHERE id = $1`,
        [userId, vFirst, vLast, vDob, vName],
      ).catch(() => {});
    }

    if (notify && userEmail) sendKycApprovedEmail(userEmail, userName).catch(() => {});
    if (notify) sendPushNotification(userId, 'Identity Verified! ✅', 'Your identity has been verified. You now have full access to all Bago features.', { type: 'kyc_approved' }).catch(() => {});
    await updatePremblySessionStatus(userId, 'approved', rawPayload, { referenceId, source: 'apply_result' });
    return { status: 'approved' };
  }

  if (status === 'pending') {
    await query(
      `UPDATE public.profiles
       SET kyc_status = 'pending', kyc_provider = 'prembly', kyc_verified_data = $2, updated_at = NOW()
       WHERE id = $1 AND kyc_status NOT IN ('approved', 'blocked_duplicate')`,
      [userId, stored],
    ).catch(() => {});
    if (notify && userEmail) sendKycSubmittedEmail(userEmail, userName).catch(() => {});
    if (notify) sendPushNotification(userId, 'Verification Under Review ⏳', "Your identity verification is being reviewed. We'll notify you when it's approved.", { type: 'kyc_pending' }).catch(() => {});
    await updatePremblySessionStatus(userId, 'pending', rawPayload, { referenceId, source: 'apply_result' });
    return { status: 'pending' };
  }

  if (status === 'declined') {
    const reason = rawPayload?.data?.reason || 'Prembly verification not approved';
    await query(
      `UPDATE public.profiles
       SET kyc_status = 'declined', kyc_provider = 'prembly', kyc_failure_reason = $2, kyc_verified_data = $3, updated_at = NOW()
       WHERE id = $1`,
      [userId, reason, stored],
    );
    if (notify && userEmail) sendKycDeclinedEmail(userEmail, userName, reason).catch(() => {});
    if (notify) sendPushNotification(userId, 'Verification Not Approved', 'Your identity verification was not approved. Please try again.', { type: 'kyc_declined' }).catch(() => {});
    await updatePremblySessionStatus(userId, 'declined', rawPayload, { referenceId, source: 'apply_result' });
    return { status: 'declined', reason };
  }

  return { status: 'unknown' };
}

// ---------------------------------------------------------------------------
// POST /api/bago/kyc/prembly/start
// Creates a Prembly IdentityForm session and returns the signed verification
// URL. No credentials are returned to the frontend.
// ---------------------------------------------------------------------------
export const startPremblySession = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    if (!isPremblyConfigured()) {
      return res.status(503).json({ success: false, message: 'Identity verification is not available right now. Please try again later.' });
    }

    const gate = await runPreKycChecks(req.user, req);
    if (!gate.allowed) {
      return res.status(403).json({ success: false, blocked: true, status: gate.status, nameRequired: gate.nameRequired || false, message: gate.message });
    }

    const userRow = await queryOne(
      `SELECT email, first_name, last_name, date_of_birth FROM public.profiles WHERE id = $1`,
      [userId],
    );
    if (!userRow) return res.status(404).json({ success: false, message: 'User not found' });

    const verificationRef = `bago-${userId}-${crypto.randomUUID()}`;
    const country = (req.body?.country || '').toUpperCase().trim();

    const activeSession = await activePremblySessionForUser(userId);
    if (activeSession?.verificationUrl) {
      return res.json({
        success: true,
        provider: 'prembly',
        activeSession: true,
        kycStatus: 'pending',
        verificationUrl: activeSession.verificationUrl,
        verificationRef: activeSession.premblyRef || activeSession.verificationRef || activeSession.sessionId || activeSession.userRef,
        callbackUrl: PREMBLY_CALLBACK_URL,
        message: 'A verification session is already active. Please finish that session or wait before starting another.',
      });
    }

    const widgetId = PREMBLY_WIDGET_ID || PREMBLY_CONFIG_ID;
    if (!widgetId || !PREMBLY_WIDGET_KEY) {
      return res.status(503).json({
        success: false,
        message: 'Identity verification widget is not configured. Please contact support.',
      });
    }

    // Create the same SDK session Prembly's inline widget creates, then return
    // the hosted SDK URL for web iframe usage.
    const sessionEndpoint = PREMBLY_SDK_SESSION_URL;
    const sessionBody = {
      widget_id:    widgetId,
      widget_key:   PREMBLY_WIDGET_KEY,
      first_name:   userRow.first_name || undefined,
      last_name:    userRow.last_name  || undefined,
      email:        userRow.email      || undefined,
      phone:        req.body?.phone || undefined,
      metadata:     {
        user_ref: verificationRef,
        userId,
        country,
        callback_url: PREMBLY_CALLBACK_URL,
      },
    };
    console.info('Prembly SDK session request →', sessionEndpoint, JSON.stringify({ ...sessionBody, widget_key: '***' }));
    const premblyRes = await axios.post(sessionEndpoint, sessionBody, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const sessionId =
      premblyRes.data?.data?.session_id ||
      premblyRes.data?.session_id ||
      premblyRes.data?.data?.sessionId ||
      premblyRes.data?.sessionId;
    const hostedSdkUrl = sessionId
      ? `${PREMBLY_SDK_LIVE_URL.replace(/\/$/, '')}/?session=${encodeURIComponent(sessionId)}`
      : '';
    const verificationUrl =
      hostedSdkUrl ||
      premblyRes.data?.data?.url ||
      premblyRes.data?.data?.verification_url ||
      premblyRes.data?.data?.widget_url ||
      premblyRes.data?.data?.redirect_url ||
      premblyRes.data?.data?.link ||
      premblyRes.data?.url ||
      premblyRes.data?.verification_url ||
      premblyRes.data?.widget_url ||
      premblyRes.data?.redirect_url ||
      premblyRes.data?.link;
    const premblyRef =
      premblyRes.data?.data?.verification_ref ||
      premblyRes.data?.data?.verificationRef ||
      premblyRes.data?.data?.reference_id ||
      premblyRes.data?.verification_ref ||
      premblyRes.data?.verificationRef ||
      premblyRes.data?.reference_id ||
      verificationRef;

    if (!verificationUrl) {
      console.error('Prembly did not return a verification URL:', JSON.stringify(premblyRes.data).slice(0, 500));
      return res.status(502).json({ success: false, message: 'Could not create a verification session. Please try again.' });
    }

    // Store the reference so the webhook can find this user later
    await query(
      `UPDATE public.profiles
       SET kyc_provider    = 'prembly',
           kyc_status      = CASE WHEN kyc_status IN ('approved','blocked_duplicate','declined') THEN kyc_status ELSE 'not_started' END,
           kyc_verified_data = CASE
             WHEN kyc_status IN ('approved','blocked_duplicate') THEN kyc_verified_data
             ELSE COALESCE(kyc_verified_data, '{}'::jsonb) || jsonb_build_object(
               'provider', 'prembly',
               'verificationRef', $2,
               'premblyRef', $3,
               'userId', $1,
               'country', $4,
               'startedAt', timezone('utc', now())
             )
           END,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, verificationRef, premblyRef, country],
    ).catch(() => {});

    await recordPremblySession({
      userId,
      verificationRef,
      premblyRef,
      sessionId,
      userRef: verificationRef,
      status: 'started',
      source: 'backend_start',
      verificationUrl,
      rawPayload: premblyRes.data,
    }).catch((err) => console.warn('Prembly session record failed:', err?.message || err));

    return res.json({
      success: true,
      provider: 'prembly',
      verificationUrl,
      verificationRef: premblyRef,
      callbackUrl: PREMBLY_CALLBACK_URL,
    });
  } catch (err) {
    console.error('startPremblySession error:', JSON.stringify(err?.response?.data || err.message));
    console.error('startPremblySession status:', err?.response?.status);
    const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.response?.data?.error || err.message || 'Failed to start verification';
    res.status(502).json({ success: false, message: msg });
  }
};

// ---------------------------------------------------------------------------
// GET /api/bago/kyc/prembly/complete
// Prembly redirects here after the user finishes (or exits) the form.
// The Flutter WebView and web iframe watch for this URL to auto-close.
// ---------------------------------------------------------------------------
export const premblyComplete = async (req, res) => {
  const payload = {
    ...(req.query || {}),
    ...(req.body || {}),
  };
  const verificationRef = verificationRefFromPayload(payload);
  const status = normalizePremblyStatus(payload);

  if (verificationRef && status !== 'unknown') {
    try {
      const userId = await findPremblyUserId(verificationRef);
      if (userId) {
        await applyPremblyResult(userId, status, payload, { referenceId: verificationRef, notify: true });
      } else {
        console.warn('Prembly complete: cannot resolve userId from ref', verificationRef);
      }
    } catch (err) {
      console.error('premblyComplete apply result error:', err?.message || err);
    }
  }

  const frontendUrl = process.env.FRONTEND_URL || process.env.WEBAPP_URL || 'https://sendwithbago.com';
  const payloadJson = JSON.stringify(payload).replace(/</g, '\\u003c');
  const returnUrl = `${frontendUrl.replace(/\/$/, '')}/verify?prembly=complete`;
  // Return a completion page that redirects embedded web flows and still gives
  // users an obvious manual path back if browser iframe rules block the script.
  res.set('Content-Type', 'text/html').send(`<!DOCTYPE html>
<html>
<head>
  <title>Verification Complete</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="4;url=${returnUrl.replace(/"/g, '&quot;')}" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #ffffff;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 24px;
    }
    main {
      width: min(420px, 100%);
      text-align: center;
    }
    h1 {
      margin: 0 0 12px;
      font-size: clamp(24px, 7vw, 34px);
      line-height: 1.12;
      letter-spacing: 0;
    }
    p {
      margin: 0 0 24px;
      color: #4b5563;
      font-size: 16px;
      line-height: 1.5;
    }
    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0 22px;
      border-radius: 8px;
      background: #5845D8;
      color: #ffffff;
      font-weight: 700;
      text-decoration: none;
    }
    small {
      display: block;
      margin-top: 16px;
      color: #6b7280;
    }
  </style>
</head>
<body>
<main>
  <h1>Verification Complete</h1>
  <p>Return to Bago to see your verification status.</p>
  <a id="return-link" href="${returnUrl.replace(/"/g, '&quot;')}" target="_top" rel="noopener">Go back to Bago</a>
  <small>Redirecting automatically...</small>
</main>
<script>
  var payload = ${payloadJson};
  var returnUrl = ${JSON.stringify(returnUrl)};
  function goBackToBago() {
    try { window.top.location.href = returnUrl; return; } catch(e) {}
    try { window.parent.location.href = returnUrl; return; } catch(e) {}
    window.location.href = returnUrl;
  }
  try { window.opener && window.opener.postMessage({ type: 'prembly_complete', payload: payload }, '*'); } catch(e) {}
  try { window.parent && window.parent !== window && window.parent.postMessage({ type: 'prembly_complete', payload: payload }, '*'); } catch(e) {}
  try { document.getElementById('return-link').addEventListener('click', goBackToBago); } catch(e) {}
  setTimeout(function() {
    goBackToBago();
    try { window.close(); } catch(e) {}
  }, 1200);
</script>
</body>
</html>`);
};

// ---------------------------------------------------------------------------
// POST /api/bago/kyc/prembly/webhook
// Called by Prembly when verification completes. No auth — Prembly servers only.
// ---------------------------------------------------------------------------
export const premblyWebhook = async (req, res) => {
  try {
    const payload = req.body;
    console.log('Prembly webhook received:', JSON.stringify(payload).slice(0, 600));

    const verificationRef = verificationRefFromPayload(payload) || sessionIdFromPayload(payload) || userRefFromPayload(payload);
    const status          = normalizePremblyStatus(payload);

    if (!verificationRef) {
      console.warn('Prembly webhook: no verification_ref in payload');
      return res.status(200).json({ received: true, note: 'no verification_ref' });
    }

    const userId = await findPremblyUserId(verificationRef);
    if (!userId) {
      console.warn('Prembly webhook: cannot resolve userId from ref', verificationRef);
      return res.status(200).json({ received: true, note: 'user not found' });
    }

    await applyPremblyResult(userId, status, payload, { referenceId: verificationRef, notify: true });
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('premblyWebhook error:', err);
    return res.status(200).json({ received: true, error: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/bago/kyc/prembly/sync-result
// Called by the client after returning from the verification page.
// Actively fetches the result from Prembly API.
// ---------------------------------------------------------------------------
export const syncPremblyResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    // Check current stored status first
    const existing = await queryOne(
      `SELECT kyc_status AS "kycStatus", kyc_verified_data AS "kycVerifiedData" FROM public.profiles WHERE id = $1`,
      [userId],
    );
    const currentStatus = existing?.kycStatus || 'not_started';
    if (['approved', 'blocked_duplicate'].includes(currentStatus)) {
      return res.json({ success: true, kycStatus: currentStatus, source: 'db' });
    }

    const callbackPayload = callbackPayloadFromBody(req.body);
    const callbackRef = verificationRefFromPayload(callbackPayload);
    const callbackStatus = normalizePremblyStatus(callbackPayload);
    const hasCallbackPayload = Object.keys(callbackPayload || {}).length > 0;
    const callbackError = callbackPayload?.error || callbackPayload?.message;

    const verificationRef =
      existing?.kycVerifiedData?.verificationRef ||
      existing?.kycVerifiedData?.premblyRef ||
      existing?.kycVerifiedData?.referenceId ||
      req.body?.verificationRef ||
      callbackRef ||
      '';

    if (callbackStatus !== 'unknown') {
      const result = await applyPremblyResult(userId, callbackStatus, callbackPayload, { referenceId: verificationRef, notify: true });
      if (['approved', 'declined', 'blocked_duplicate', 'pending'].includes(result.status)) {
        return res.json({ success: true, kycStatus: result.status, source: 'sdk_callback' });
      }
    }

    if (callbackRef && !existing?.kycVerifiedData?.verificationRef && !existing?.kycVerifiedData?.premblyRef) {
      await query(
        `UPDATE public.profiles
         SET kyc_provider = 'prembly',
             kyc_status = CASE WHEN kyc_status IN ('approved','blocked_duplicate','declined') THEN kyc_status ELSE 'pending' END,
             kyc_verified_data = COALESCE(kyc_verified_data, '{}'::jsonb) || jsonb_build_object(
               'provider', 'prembly',
               'verificationRef', $2,
               'premblyRef', $2,
               'userRef', $3,
               'payload', $4,
               'syncedAt', timezone('utc', now())
             ),
             updated_at = NOW()
         WHERE id = $1 AND kyc_status NOT IN ('approved', 'blocked_duplicate')`,
        [userId, callbackRef, req.body?.userRef || callbackPayload?.user_ref || callbackPayload?.userRef || userId, callbackPayload],
      ).catch(() => {});
    }

    if (!verificationRef && !['approved', 'blocked_duplicate', 'declined'].includes(currentStatus)) {
      await query(
        `UPDATE public.profiles
         SET kyc_provider = 'prembly',
             kyc_status = 'pending',
             kyc_verified_data = COALESCE(kyc_verified_data, '{}'::jsonb) || jsonb_build_object(
               'provider', 'prembly',
               'userRef', $2,
               'userId', $2,
               'payload', $3,
               'lastSyncNote', $4,
               'syncedAt', timezone('utc', now())
             ),
             updated_at = NOW()
         WHERE id = $1 AND kyc_status NOT IN ('approved', 'blocked_duplicate', 'declined')`,
        [
          userId,
          userId,
          hasCallbackPayload ? callbackPayload : {},
          callbackError ? String(callbackError).slice(0, 200) : 'prembly_sync_without_reference',
        ],
      ).catch(() => {});
      return res.json({ success: true, kycStatus: 'pending', source: callbackError ? 'sdk_callback_error' : 'db_no_reference' });
    }

    if (!verificationRef || !isPremblyConfigured()) {
      return res.json({ success: true, kycStatus: currentStatus, source: 'db' });
    }

    // Fetch result from Prembly
    try {
      const premblyRes = await axios.get(
        `${PREMBLY_BASE}/verification`,
        { params: { verification_ref: verificationRef }, headers: premblyHeaders(), timeout: 12000 },
      );
      const status = normalizePremblyStatus(premblyRes.data);
      if (status !== 'unknown') {
        const result = await applyPremblyResult(userId, status, premblyRes.data, { referenceId: verificationRef, notify: true });
        return res.json({ success: true, kycStatus: result.status, source: 'prembly_api' });
      }
    } catch (apiErr) {
      console.log('Prembly sync API call failed (webhook fallback active):', apiErr.message);
    }

    return res.json({ success: true, kycStatus: currentStatus, source: 'db' });
  } catch (err) {
    console.error('syncPremblyResult error:', err);
    return res.status(500).json({ success: false, message: 'Failed to sync result' });
  }
};

// ---------------------------------------------------------------------------
// POST /api/bago/kyc/prembly/sync-existing
// Preflight check — same shape as Dojah's sync-existing.
// Returns current status and whether a new session can be started.
// ---------------------------------------------------------------------------
export const syncExistingPremblyResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const user = await queryOne(
      `SELECT kyc_status AS "kycStatus", kyc_provider AS "kycProvider", kyc_verified_data AS "kycVerifiedData"
       FROM public.profiles WHERE id = $1`,
      [userId],
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentStatus = user.kycStatus || 'not_started';
    if (['approved', 'blocked_duplicate', 'declined'].includes(currentStatus)) {
      return res.json({ success: true, kycStatus: currentStatus, source: 'db', canStartNewSession: currentStatus === 'declined' });
    }

    const activeSession = await activePremblySessionForUser(userId);
    if (activeSession) {
      return res.json({
        success: true,
        kycStatus: 'pending',
        source: 'prembly_session',
        canStartNewSession: false,
        activeSession: true,
        verificationRef: activeSession.premblyRef || activeSession.verificationRef || activeSession.sessionId || activeSession.userRef,
      });
    }

    const canStartNewSession = !['approved', 'blocked_duplicate'].includes(currentStatus);
    return res.json({ success: true, kycStatus: currentStatus, source: 'db', canStartNewSession });
  } catch (err) {
    console.error('syncExistingPremblyResult error:', err);
    return res.status(500).json({ success: false, message: 'Failed to check existing result' });
  }
};

export const isPremblyAvailable = isPremblyConfigured;

// ---------------------------------------------------------------------------
// Utility: sync a Prembly result for a given userId — callable from admin
// ---------------------------------------------------------------------------
export async function syncPremblyForUser(userId, { notify = true } = {}) {
  const existing = await queryOne(
    `SELECT kyc_status AS "kycStatus", kyc_verified_data AS "kycVerifiedData" FROM public.profiles WHERE id = $1`,
    [userId],
  ).catch(() => null);

  const currentStatus = existing?.kycStatus || 'not_started';
  if (['approved', 'blocked_duplicate'].includes(currentStatus)) {
    return { success: true, status: currentStatus, source: 'db' };
  }

  const verificationRef =
    existing?.kycVerifiedData?.verificationRef ||
    existing?.kycVerifiedData?.premblyRef ||
    existing?.kycVerifiedData?.referenceId ||
    '';

  if (!verificationRef || !isPremblyConfigured()) {
    return { success: false, status: currentStatus, message: 'No Prembly session reference found for this user.' };
  }

  try {
    const premblyRes = await axios.get(
      `${PREMBLY_BASE}/verification`,
      { params: { verification_ref: verificationRef }, headers: premblyHeaders(), timeout: 12000 },
    );
    const status = normalizePremblyStatus(premblyRes.data);
    if (status === 'unknown') {
      return { success: false, status: currentStatus, message: 'Prembly returned unknown status.', raw: premblyRes.data };
    }
    const result = await applyPremblyResult(userId, status, premblyRes.data, { referenceId: verificationRef, notify });
    return { success: true, status: result.status, source: 'prembly_api' };
  } catch (err) {
    return { success: false, status: currentStatus, message: err.message };
  }
}

export async function reconcilePremblySessions({ limit = 25, notify = true } = {}) {
  await ensurePremblySessionTable();
  const result = await query(
    `SELECT s.id, s.user_id AS "userId",
            COALESCE(
              NULLIF(s.verification_ref, s.user_id::text),
              NULLIF(s.prembly_ref, s.user_id::text),
              NULLIF(s.session_id, s.user_id::text)
            ) AS "reference",
            s.status
     FROM public.prembly_kyc_sessions s
     JOIN public.profiles p ON p.id = s.user_id
     WHERE s.status IN ('started', 'pending', 'processing', 'manual_review')
       AND COALESCE(p.kyc_status, 'not_started') NOT IN ('approved', 'blocked_duplicate', 'declined')
       AND COALESCE(
             NULLIF(s.verification_ref, s.user_id::text),
             NULLIF(s.prembly_ref, s.user_id::text),
             NULLIF(s.session_id, s.user_id::text)
           ) IS NOT NULL
       AND s.updated_at < timezone('utc', now()) - INTERVAL '2 minutes'
     ORDER BY s.created_at ASC
     LIMIT $1`,
    [limit],
  ).catch(() => ({ rows: [] }));

  const summary = { checked: 0, updated: 0, failed: 0 };
  for (const session of result.rows || []) {
    summary.checked += 1;
    const reference = session.reference;
    if (!reference || !isPremblyConfigured()) continue;

    try {
      const premblyRes = await axios.get(
        `${PREMBLY_BASE}/verification`,
        { params: { verification_ref: reference }, headers: premblyHeaders(), timeout: 12000 },
      );
      const status = normalizePremblyStatus(premblyRes.data);
      if (status === 'unknown') {
        await query(
          `UPDATE public.prembly_kyc_sessions
           SET last_synced_at = timezone('utc', now()),
               last_error = 'unknown_status',
               raw_payload = $2,
               updated_at = timezone('utc', now())
           WHERE id = $1`,
          [session.id, premblyRes.data],
        ).catch(() => {});
        continue;
      }
      const applied = await applyPremblyResult(session.userId, status, premblyRes.data, { referenceId: reference, notify });
      await query(
        `UPDATE public.prembly_kyc_sessions
         SET status = $2,
             raw_payload = $3,
             last_error = NULL,
             last_synced_at = timezone('utc', now()),
             completed_at = CASE WHEN $2 IN ('approved','declined','blocked_duplicate') THEN timezone('utc', now()) ELSE completed_at END,
             updated_at = timezone('utc', now())
         WHERE id = $1`,
        [session.id, applied.status || status, premblyRes.data],
      ).catch(() => {});
      if (['approved', 'declined', 'blocked_duplicate'].includes(applied.status || status)) summary.updated += 1;
    } catch (err) {
      summary.failed += 1;
      await query(
        `UPDATE public.prembly_kyc_sessions
         SET last_synced_at = timezone('utc', now()),
             last_error = $2,
             updated_at = timezone('utc', now())
         WHERE id = $1`,
        [session.id, String(err?.response?.data?.message || err.message || err).slice(0, 300)],
      ).catch(() => {});
    }
  }
  return summary;
}

export function startPremblySessionReconciler() {
  const intervalMs = Number(process.env.PREMBLY_RECONCILE_INTERVAL_MS || 5 * 60 * 1000);
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;
  setTimeout(() => reconcilePremblySessions({ notify: true }).catch((err) => {
    console.error('Prembly initial reconcile failed:', err?.message || err);
  }), 30 * 1000);
  setInterval(() => {
    reconcilePremblySessions({ notify: true }).then((summary) => {
      if (summary.checked || summary.updated || summary.failed) {
        console.log('Prembly reconcile summary:', summary);
      }
    }).catch((err) => {
      console.error('Prembly reconcile failed:', err?.message || err);
    });
  }, intervalMs);
}

export async function trackPremblyInlineStart(userId, { source = 'inline_config', rawPayload = {} } = {}) {
  if (!userId) return;
  await recordPremblySession({
    userId,
    userRef: userId,
    status: 'started',
    source,
    rawPayload,
  }).catch((err) => console.warn('Prembly inline session track failed:', err?.message || err));
}
