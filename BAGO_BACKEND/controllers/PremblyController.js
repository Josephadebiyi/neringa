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

async function findPremblyUserId(reference = '') {
  if (!reference) return '';

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
    payload: rawPayload,
  };

  if (status === 'approved') {
    const approval = await markKycApproved(userId, { provider: 'prembly', kycVerifiedData: stored });
    if (approval?.duplicate) {
      if (notify && userEmail) sendKycDeclinedEmail(userEmail, userName, approval.reason).catch(() => {});
      if (notify) sendPushNotification(userId, 'Verification Not Approved', 'This identity is already linked to another Bago account.', { type: 'kyc_duplicate' }).catch(() => {});
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

    // Create the IdentityForm session on Prembly
    const sessionEndpoint = `${PREMBLY_BASE}/verification/widget/${PREMBLY_ENV === 'sandbox' ? 'sandbox' : 'live'}`;
    const widgetId = PREMBLY_WIDGET_ID || PREMBLY_CONFIG_ID;
    const sessionBody = {
      ...(PREMBLY_CONFIG_ID && { config_id: PREMBLY_CONFIG_ID }),
      ...(widgetId && { widget_id: widgetId }),
      ...(PREMBLY_WIDGET_KEY && { widget_key: PREMBLY_WIDGET_KEY }),
      first_name:   userRow.first_name || undefined,
      last_name:    userRow.last_name  || undefined,
      email:        userRow.email      || undefined,
      user_ref:     verificationRef,
      callback_url: PREMBLY_CALLBACK_URL,
    };
    console.info('Prembly session request →', sessionEndpoint, JSON.stringify({ ...sessionBody, callback_url: '...' }));
    const premblyRes = await axios.post(sessionEndpoint, sessionBody, { headers: premblyHeaders(), timeout: 15000 });

    const verificationUrl =
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
export const premblyComplete = async (_req, res) => {
  // Return a minimal page that closes itself and posts a message to the opener.
  res.set('Content-Type', 'text/html').send(`<!DOCTYPE html>
<html>
<head><title>Verification Complete</title></head>
<body>
<script>
  try { window.opener && window.opener.postMessage({ type: 'prembly_complete' }, '*'); } catch(e) {}
  try { window.parent && window.parent !== window && window.parent.postMessage({ type: 'prembly_complete' }, '*'); } catch(e) {}
  setTimeout(() => { try { window.close(); } catch(e) {} }, 500);
</script>
<p style="font-family:sans-serif;text-align:center;margin-top:40px;">Verification complete. You can close this window.</p>
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

    const verificationRef = verificationRefFromPayload(payload);
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

    await applyPremblyResult(userId, status, payload, { referenceId: verificationRef });
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
      const result = await applyPremblyResult(userId, callbackStatus, callbackPayload, { referenceId: verificationRef, notify: false });
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
        const result = await applyPremblyResult(userId, status, premblyRes.data, { referenceId: verificationRef, notify: false });
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
