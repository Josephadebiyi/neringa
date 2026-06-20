import axios from 'axios';
import crypto from 'crypto';
import { query, queryOne } from '../lib/postgres/db.js';
import { markKycApproved } from '../lib/postgres/accounts.js';
import { sendKycApprovedEmail, sendKycSubmittedEmail, sendKycDeclinedEmail } from '../services/emailNotifications.js';
import { sendPushNotification } from '../services/pushNotificationService.js';

// ---------------------------------------------------------------------------
// Dojah-supported countries (ISO 3166-1 alpha-2)
// Dojah easyonboard covers these African nations for identity verification
// ---------------------------------------------------------------------------
export const DOJAH_COUNTRIES = new Set([
  'NG', // Nigeria
  'GH', // Ghana
  'KE', // Kenya
  'ZA', // South Africa
  'UG', // Uganda
  'RW', // Rwanda
  'TZ', // Tanzania
  'CM', // Cameroon
  'SN', // Senegal
  'CI', // Côte d'Ivoire
  'SL', // Sierra Leone
  'ZM', // Zambia
  'BJ', // Benin
  'TG', // Togo
  'ET', // Ethiopia
  'CD', // DR Congo
  'MZ', // Mozambique
  'ZW', // Zimbabwe
  'MW', // Malawi
  'GN', // Guinea
]);

const DOJAH_APP_ID  = process.env.DOJAH_APP_ID;
const DOJAH_SECRET  = process.env.DOJAH_SECRET_KEY;
const DOJAH_PUBLIC_KEY = process.env.DOJAH_PUBLIC_KEY;
const DOJAH_WIDGET_NG = process.env.DOJAH_WIDGET_NG || process.env.DOJAH_WIDGET_ID_NG || '';
const DOJAH_WIDGET_KE = process.env.DOJAH_WIDGET_KE || process.env.DOJAH_WIDGET_ID_KE || '';
const DOJAH_WIDGET_NG_KE = process.env.DOJAH_WIDGET_NG_KE || process.env.DOJAH_WIDGET_ID_NG_KE || '';
const DOJAH_WIDGET_GLOBAL = process.env.DOJAH_WIDGET_GLOBAL || process.env.DOJAH_WIDGET_ID_GLOBAL || process.env.DOJAH_WIDGET_ID || '';
const DOJAH_VERIFICATION_URL = 'https://api.dojah.io/api/v1/kyc/verification';
const DOJAH_LEGACY_EASYONBOARD_URL = 'https://api.dojah.io/api/v1/kyc/easyonboard';

const dojahAuthHeaders = () => ({ AppId: DOJAH_APP_ID, Authorization: DOJAH_SECRET });

const fetchDojahVerificationByReference = async (referenceId) => {
  const ref = String(referenceId || '').trim();
  if (!ref) throw new Error('referenceId required');

  try {
    return await axios.get(DOJAH_VERIFICATION_URL, {
      params: { reference_id: ref },
      headers: dojahAuthHeaders(),
      timeout: 10000,
    });
  } catch (error) {
    const status = error.response?.status;
    if (![400, 404, 422].includes(status)) throw error;

    return axios.get(DOJAH_LEGACY_EASYONBOARD_URL, {
      params: { referenceId: ref },
      headers: dojahAuthHeaders(),
      timeout: 10000,
    });
  }
};

const widgetConfigForCountry = (country = '', clientWidgetId = '') => {
  const code = country.toUpperCase().trim();
  const clientId = clientWidgetId.toString().trim();

  if (code === 'NG') {
    const widgetId = DOJAH_WIDGET_NG || DOJAH_WIDGET_NG_KE || clientId;
    return {
      widgetId,
      widgetSource: DOJAH_WIDGET_NG ? 'server:DOJAH_WIDGET_NG' : (DOJAH_WIDGET_NG_KE ? 'server:DOJAH_WIDGET_NG_KE' : 'client'),
      missingEnv: !widgetId ? 'DOJAH_WIDGET_NG' : null,
    };
  }

  if (code === 'KE') {
    const widgetId = DOJAH_WIDGET_KE || DOJAH_WIDGET_NG_KE || clientId;
    return {
      widgetId,
      widgetSource: DOJAH_WIDGET_KE ? 'server:DOJAH_WIDGET_KE' : (DOJAH_WIDGET_NG_KE ? 'server:DOJAH_WIDGET_NG_KE' : 'client'),
      missingEnv: !widgetId ? 'DOJAH_WIDGET_KE' : null,
    };
  }

  const widgetId = DOJAH_WIDGET_GLOBAL || clientId || DOJAH_WIDGET_NG || DOJAH_WIDGET_KE || DOJAH_WIDGET_NG_KE;
  return {
    widgetId,
    widgetSource: DOJAH_WIDGET_GLOBAL ? 'server:DOJAH_WIDGET_GLOBAL' : (clientId ? 'client' : 'server:fallback'),
    missingEnv: !widgetId ? 'DOJAH_WIDGET_GLOBAL' : null,
  };
};

const userIdFromReferenceId = (referenceId = '') => {
  const value = referenceId.toString().trim();
  const match = value.match(/^bago-(.+)-\d+$/);
  return match?.[1] || value;
};

const normalizeWebhookValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'string') return value.toLowerCase().trim();
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).toLowerCase().trim();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeWebhookValue).find(Boolean) || '';
  }
  if (typeof value === 'object') {
    for (const key of [
      'status',
      'value',
      'decision',
      'result',
      'verificationStatus',
      'verification_status',
      'state',
      'name',
      'message',
    ]) {
      const normalized = normalizeWebhookValue(value[key]);
      if (normalized && normalized !== 'true' && normalized !== 'false') {
        return normalized;
      }
    }
    return '';
  }
  return '';
};

const firstWebhookValue = (...values) => {
  for (const value of values) {
    const normalized = normalizeWebhookValue(value);
    if (normalized) return normalized;
  }
  return '';
};

const DOJAH_APPROVED_STATUSES = new Set([
  'success',
  'successful',
  'approved',
  'verified',
  'completed',
  'complete',
  'passed',
  'pass',
  'accepted',
]);

const DOJAH_PENDING_STATUSES = new Set([
  'pending',
  'submitted',
  'processing',
  'in_progress',
  'review',
  'manual_review',
  'under_review',
]);

const DOJAH_DECLINED_STATUSES = new Set([
  'failed',
  'failure',
  'declined',
  'rejected',
  'reject',
  'denied',
  'unsuccessful',
]);

const isApprovedStatus = (status) => DOJAH_APPROVED_STATUSES.has(status);
const isPendingStatus = (status) => DOJAH_PENDING_STATUSES.has(status);
const isDeclinedStatus = (status) => DOJAH_DECLINED_STATUSES.has(status);

const firstReferenceId = (event = {}) =>
  event?.data?.metadata?.referenceId ||
  event?.data?.metadata?.reference_id ||
  event?.metadata?.referenceId ||
  event?.metadata?.reference_id ||
  event?.data?.referenceId ||
  event?.data?.reference_id ||
  event?.referenceId ||
  event?.reference_id ||
  event?.data?.entity?.referenceId ||
  event?.data?.entity?.reference_id ||
  event?.entity?.referenceId ||
  event?.entity?.reference_id ||
  '';

export const dojahReferenceFromPayload = (payload = {}) =>
  firstReferenceId(payload) ||
  payload?.referenceId ||
  payload?.reference_id ||
  payload?.data?.referenceId ||
  payload?.data?.reference_id ||
  payload?.data?.metadata?.referenceId ||
  payload?.data?.metadata?.reference_id ||
  payload?.metadata?.referenceId ||
  payload?.metadata?.reference_id ||
  '';

const dojahStatusFromPayload = (payload = {}) => firstWebhookValue(
  payload?.status,
  payload?.verificationStatus,
  payload?.verification_status,
  payload?.decision,
  payload?.result,
  payload?.data?.status,
  payload?.data?.verificationStatus,
  payload?.data?.verification_status,
  payload?.data?.decision,
  payload?.data?.result,
  payload?.data?.entity?.status,
  payload?.data?.entity?.verification_status,
  payload?.data?.entity?.verificationStatus,
);

const effectiveStoredKycStatus = (status, payload = {}) => {
  const normalized = String(status || 'not_started').trim().toLowerCase() || 'not_started';
  if (normalized !== 'pending') return normalized;
  return isPendingStatus(dojahStatusFromPayload(payload)) ? 'pending' : 'not_started';
};

async function applyDojahEventToUser(userId, event, {
  referenceId = '',
  notify = true,
  source = 'dojah_api',
} = {}) {
  const rawStatus = firstWebhookValue(
    event?.status,
    event?.verificationStatus,
    event?.verification_status,
    event?.decision,
    event?.result,
    event?.verification?.status,
    event?.entity?.status,
    event?.entity?.verification_status,
    event?.entity?.verificationStatus,
    event?.data?.status,
    event?.data?.verification_status,
    event?.data?.verificationStatus,
    event?.data?.decision,
    event?.data?.result,
  );

  const webhookShape = {
    data: {
      ...event,
      metadata: {
        ...(event?.metadata || event?.data?.metadata || {}),
        userId,
        user_id: userId,
        referenceId,
        reference_id: referenceId,
      },
    },
    status: rawStatus,
    referenceId,
    reference_id: referenceId,
    source,
  };

  const userRow = await queryOne(
    `SELECT email, first_name, last_name FROM public.profiles WHERE id = $1`,
    [userId],
  ).catch(() => null);
  const userEmail = userRow?.email;
  const userName = [userRow?.first_name, userRow?.last_name].filter(Boolean).join(' ') || 'there';

  if (isApprovedStatus(rawStatus)) {
    const approval = await markKycApproved(userId, {
      provider: 'dojah',
      kycVerifiedData: webhookShape,
    });
    if (approval?.duplicate) {
      if (notify && userEmail) sendKycDeclinedEmail(userEmail, userName, approval.reason).catch(() => {});
      if (notify) {
        sendPushNotification(
          userId,
          'Verification Not Approved',
          'This identity appears to already be linked to another Bago account.',
          { type: 'kyc_duplicate' },
        ).catch(() => {});
      }
      return { status: 'blocked_duplicate', rawStatus, duplicate: true, reason: approval.reason };
    }
    if (notify && userEmail) sendKycApprovedEmail(userEmail, userName).catch(() => {});
    if (notify) {
      sendPushNotification(
        userId,
        'Identity Verified! ✅',
        'Your identity has been verified. You now have full access to all Bago features.',
        { type: 'kyc_approved' },
      ).catch(() => {});
    }
    return { status: 'approved', rawStatus };
  }

  if (isDeclinedStatus(rawStatus)) {
    const reason = event?.reason || event?.failureReason || event?.data?.reason || event?.data?.failureReason || 'Dojah verification declined';
    await query(
      `UPDATE public.profiles
       SET kyc_status = 'declined',
           kyc_provider = 'dojah',
           kyc_failure_reason = $2,
           kyc_verified_data = $3,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, reason, webhookShape],
    );
    if (notify && userEmail) sendKycDeclinedEmail(userEmail, userName, reason).catch(() => {});
    if (notify) {
      sendPushNotification(
        userId,
        'Verification Not Approved',
        'Your identity verification was not approved. Please check your details and try again.',
        { type: 'kyc_declined' },
      ).catch(() => {});
    }
    return { status: 'declined', rawStatus, reason };
  }

  if (isPendingStatus(rawStatus)) {
    await query(
      `UPDATE public.profiles
       SET kyc_status = 'pending',
           kyc_provider = 'dojah',
           kyc_verified_data = $2,
           updated_at = NOW()
       WHERE id = $1 AND kyc_status NOT IN ('approved', 'blocked_duplicate')`,
      [userId, webhookShape],
    ).catch(() => {});
    return { status: 'pending', rawStatus };
  }

  return { status: 'unknown', rawStatus };
}

export async function syncDojahReferenceForUser(userId, referenceId, { notify = false } = {}) {
  if (!DOJAH_APP_ID || !DOJAH_SECRET) {
    return { success: false, status: 'not_configured', message: 'Dojah API credentials are not configured.' };
  }

  const ref = String(referenceId || '').trim();
  if (!userId || !ref) {
    return { success: false, status: 'missing_reference', message: 'No Dojah referenceId is stored for this user.' };
  }

  try {
    const dojahResp = await fetchDojahVerificationByReference(ref);

    const event = dojahResp.data?.data ?? dojahResp.data;
    const result = await applyDojahEventToUser(userId, event, {
      referenceId: ref,
      notify,
      source: 'admin_dojah_sync',
    });
    return { success: true, referenceId: ref, ...result };
  } catch (error) {
    return {
      success: false,
      status: 'sync_failed',
      referenceId: ref,
      message: error.response?.data?.message || error.message || 'Dojah sync failed.',
    };
  }
}

export const syncExistingDojahResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const user = await queryOne(
      `SELECT kyc_status AS "kycStatus",
              kyc_provider AS "kycProvider",
              kyc_verified_data AS "kycVerifiedData"
       FROM public.profiles
       WHERE id = $1`,
      [userId],
    );

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const currentStatus = effectiveStoredKycStatus(user.kycStatus, user.kycVerifiedData);
    if (['approved', 'blocked_duplicate', 'declined'].includes(currentStatus)) {
      return res.json({ success: true, kycStatus: currentStatus, source: 'db' });
    }

    if (user.kycProvider !== 'dojah') {
      return res.json({
        success: true,
        kycStatus: currentStatus,
        source: 'db',
        canStartNewSession: true,
      });
    }

    const referenceId = dojahReferenceFromPayload(user.kycVerifiedData || {});
    if (!referenceId) {
      return res.json({
        success: true,
        kycStatus: currentStatus,
        source: 'db',
        canStartNewSession: true,
        reason: 'missing_reference',
      });
    }

    const result = await syncDojahReferenceForUser(userId, referenceId, { notify: true });
    const finalStatus = ['approved', 'declined', 'blocked_duplicate', 'pending'].includes(result.status)
      ? result.status
      : currentStatus;
    const canStartNewSession = !['approved', 'blocked_duplicate', 'pending'].includes(finalStatus);

    return res.json({
      success: true,
      kycStatus: finalStatus,
      source: result.success ? 'dojah_api' : 'db',
      canStartNewSession,
      referenceId,
      syncStatus: result.status,
      message: result.message || null,
    });
  } catch (err) {
    console.error('syncExistingDojahResult error:', err);
    return res.status(500).json({ success: false, message: 'Failed to check existing Dojah result' });
  }
};

const lookupUserIdByEmail = async (email = '') => {
  const e = email.toString().trim().toLowerCase();
  if (!e) return null;
  const row = await queryOne(
    `SELECT id FROM public.profiles WHERE lower(email) = $1 LIMIT 1`,
    [e],
  ).catch(() => null);
  return row?.id || null;
};

const lookupUserIdByDojahReference = async (referenceId = '') => {
  const ref = referenceId.toString().trim();
  if (!ref) return null;
  const row = await queryOne(
    `SELECT id
     FROM public.profiles
     WHERE kyc_provider = 'dojah'
       AND kyc_verified_data IS NOT NULL
       AND (
         kyc_verified_data->>'referenceId' = $1
         OR kyc_verified_data->>'reference_id' = $1
         OR kyc_verified_data#>>'{metadata,referenceId}' = $1
         OR kyc_verified_data#>>'{metadata,reference_id}' = $1
         OR kyc_verified_data#>>'{data,metadata,referenceId}' = $1
         OR kyc_verified_data#>>'{data,metadata,reference_id}' = $1
       )
     ORDER BY updated_at DESC
     LIMIT 1`,
    [ref],
  ).catch(() => null);
  return row?.id || null;
};

// ---------------------------------------------------------------------------
// GET /api/bago/kyc/provider?country=NG
// Returns which provider to use + config the client needs
// ---------------------------------------------------------------------------
export const getKycProvider = async (req, res) => {
  const country = (req.query.country || req.body?.country || '').toUpperCase().trim();
  if (!country) {
    return res.status(400).json({ success: false, message: 'country is required' });
  }

  // Dojah handles global documents — route every country through Dojah when keys
  // are configured. Fall back to manual review only if keys are missing.
  if (!DOJAH_APP_ID || !DOJAH_PUBLIC_KEY) {
    return res.json({ success: true, provider: 'manual', country });
  }

  const widgetConfig = widgetConfigForCountry(country);
  if (!widgetConfig.widgetId) {
    return res.status(503).json({
      success: false,
      message: `Dojah widget is not configured for ${country}. Set ${widgetConfig.missingEnv}.`,
    });
  }

  return res.json({
    success: true,
    provider: 'dojah',
    country,
    appId: DOJAH_APP_ID,
    publicKey: DOJAH_PUBLIC_KEY,
    widgetId: widgetConfig.widgetId,
    widgetSource: widgetConfig.widgetSource,
  });
};

// ---------------------------------------------------------------------------
// POST /api/bago/kyc/dojah/start
// Stores the Dojah reference and returns widget config. The user is only moved
// to pending after Dojah confirms a submitted/review status.
// ---------------------------------------------------------------------------
export const startDojahSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    if (!DOJAH_APP_ID || !DOJAH_PUBLIC_KEY) {
      return res.status(503).json({ success: false, message: 'Dojah is not configured on the server' });
    }

    const country = (req.body?.country || req.query?.country || '').toUpperCase().trim();
    const referenceId = (req.body?.referenceId || req.query?.referenceId || `bago-${crypto.randomUUID()}`).toString().trim();
    const widgetConfig = widgetConfigForCountry(country, req.body?.widgetId);
    const widgetId = widgetConfig.widgetId;

    if (!widgetId) {
      return res.status(503).json({
        success: false,
        message: `Dojah widget is not configured for ${country || 'this country'}. Set ${widgetConfig.missingEnv}.`,
      });
    }

    // Store the Dojah reference immediately. This lets a later webhook/API
    // result be matched back to the profile even if Dojah omits user metadata.
    await query(
      `UPDATE public.profiles
       SET kyc_provider = 'dojah',
           kyc_status = CASE
             WHEN kyc_status IN ('approved', 'blocked_duplicate', 'declined', 'pending') THEN kyc_status
             ELSE COALESCE(NULLIF(kyc_status, ''), 'not_started')
           END,
           kyc_verified_data = CASE
             WHEN kyc_status IN ('approved', 'blocked_duplicate') THEN kyc_verified_data
             ELSE COALESCE(kyc_verified_data, '{}'::jsonb) || jsonb_strip_nulls(jsonb_build_object(
               'provider', 'dojah',
               'referenceId', $2,
               'reference_id', $2,
               'userId', $1,
               'country', $3,
               'widgetId', $4,
               'startedAt', timezone('utc', now())
             ))
           END,
           updated_at = NOW()
       WHERE id = $1`,
      [userId, referenceId, country, widgetId],
    ).catch(() => {});

    return res.json({
      success: true,
      provider: 'dojah',
      appId: DOJAH_APP_ID,
      publicKey: DOJAH_PUBLIC_KEY,
      country,
      referenceId,
      widgetId,
      widgetSource: widgetConfig.widgetSource,
      userId,
    });
  } catch (err) {
    console.error('startDojahSession error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/bago/kyc/dojah/webhook
// Dojah calls this when verification completes.
// Handles both production and sandbox payload shapes.
// ---------------------------------------------------------------------------
export const dojahWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log('Dojah webhook received:', JSON.stringify(event).slice(0, 500));

    // --- Extract status (many field names used across sandbox vs live) ------
    const rawStatus = firstWebhookValue(
      event?.data?.status,
      event?.data?.verification_status,
      event?.data?.verificationStatus,
      event?.data?.decision,
      event?.data?.result,
      event?.data?.verification?.status,
      event?.status,
      event?.verification_status,
      event?.verificationStatus,
      event?.decision,
      event?.result,
    );

    // --- Extract userId / referenceId --------------------------------------
    const rawUserId =
      event?.data?.entity?.userId ||
      event?.data?.entity?.user_id ||
      event?.data?.metadata?.userId ||
      event?.data?.metadata?.user_id ||
      event?.metadata?.userId ||
      event?.metadata?.user_id ||
      event?.data?.metadata?.referenceId ||
      event?.data?.metadata?.reference_id ||
      event?.data?.referenceId ||
      event?.data?.reference_id ||
      event?.referenceId ||
      event?.reference_id ||
      // sandbox sometimes puts it at the top level
      event?.data?.entity?.id;
    const referenceId = firstReferenceId(event);

    // Email from Dojah payload — used as last-resort user lookup
    const webhookEmail =
      event?.data?.entity?.email ||
      event?.data?.metadata?.email ||
      event?.entity?.email ||
      event?.data?.email ||
      event?.email ||
      '';

    const userId =
      userIdFromReferenceId(rawUserId) ||
      await lookupUserIdByDojahReference(referenceId) ||
      await lookupUserIdByEmail(webhookEmail);

    if (!userId) {
      console.warn('Dojah webhook: no userId found in payload', { rawUserId, referenceId, webhookEmail: webhookEmail || '(none)' });
      return res.status(200).json({ received: true, note: 'no userId in payload' });
    }
    console.log(`Dojah webhook: matched userId=${userId} via ${userIdFromReferenceId(rawUserId) ? 'referenceId-format' : referenceId ? 'stored-reference' : 'email'}`);

    // Fetch user profile for notifications
    const userRow = await queryOne(
      `SELECT email, first_name, last_name FROM public.profiles WHERE id = $1`,
      [userId],
    ).catch(() => null);
    const userEmail = userRow?.email;
    const userName = [userRow?.first_name, userRow?.last_name].filter(Boolean).join(' ') || 'there';

    const approved = isApprovedStatus(rawStatus);
    const pending = isPendingStatus(rawStatus);
    const declined = isDeclinedStatus(rawStatus);

    if (approved) {
      const approval = await markKycApproved(userId, { provider: 'dojah', kycVerifiedData: event });
      if (approval?.duplicate) {
        console.log(`Dojah webhook: duplicate identity blocked userId=${userId} duplicate=${approval.duplicateUserId}`);
        if (userEmail) sendKycDeclinedEmail(userEmail, userName, approval.reason).catch(() => {});
        sendPushNotification(
          userId,
          'Verification Not Approved',
          'This identity appears to already be linked to another Bago account.',
          { type: 'kyc_duplicate' },
        ).catch(() => {});
        return res.status(200).json({ received: true, duplicate: true });
      }
      console.log(`Dojah webhook: approved userId=${userId}`);
      if (userEmail) sendKycApprovedEmail(userEmail, userName).catch(() => {});
      sendPushNotification(
        userId,
        'Identity Verified! ✅',
        'Your identity has been verified. You now have full access to all Bago features.',
        { type: 'kyc_approved' },
      ).catch(() => {});
    } else if (pending) {
      await query(
        `UPDATE public.profiles
         SET kyc_status = 'pending',
             kyc_provider = 'dojah',
             kyc_verified_data = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [userId, event],
      ).catch(() => {});
      console.log(`Dojah webhook: pending/review userId=${userId}`);
      if (userEmail) sendKycSubmittedEmail(userEmail, userName).catch(() => {});
      sendPushNotification(
        userId,
        'Verification Under Review \u23f3',
        "Your identity verification has been submitted and is being reviewed. We'll notify you once it's approved.",
        { type: 'kyc_pending' },
      ).catch(() => {});
    } else if (declined) {
      const reason = event?.data?.reason || event?.data?.failureReason || 'Dojah verification declined';
      await query(
        `UPDATE public.profiles
         SET kyc_status = 'declined',
             kyc_provider = 'dojah',
             kyc_failure_reason = $2,
             kyc_verified_data = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [userId, reason, event],
      );
      console.log(`Dojah webhook: declined userId=${userId} reason=${reason}`);
      if (userEmail) sendKycDeclinedEmail(userEmail, userName, reason).catch(() => {});
      sendPushNotification(
        userId,
        'Verification Not Approved',
        'Your identity verification was not approved. Please check your details and try again.',
        { type: 'kyc_declined' },
      ).catch(() => {});
    } else {
      console.log(`Dojah webhook: unhandled status="${rawStatus}" for userId=${userId}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('dojahWebhook error:', err);
    res.status(200).json({ received: true, error: err.message });
  }
};

// ---------------------------------------------------------------------------
// GET /api/bago/kyc/status
// Lightweight poll endpoint — app calls this after widget onSuccess to wait
// for the webhook to flip kyc_status to approved/declined.
// ---------------------------------------------------------------------------
export const getKycStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const row = await queryOne(
      `SELECT kyc_status AS "kycStatus", kyc_provider AS "kycProvider",
              kyc_failure_reason AS "kycFailureReason",
              kyc_verified_data AS "kycVerifiedData"
       FROM public.profiles WHERE id = $1`,
      [userId],
    );

    if (!row) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      kycStatus: effectiveStoredKycStatus(row.kycStatus, row.kycVerifiedData),
      kycProvider: row.kycProvider,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/bago/kyc/dojah/sync-result
// Called by the app immediately after the Dojah SDK returns a non-closed
// result.  Actively fetches the verification result from Dojah's API using
// the referenceId so we don't depend on the webhook arriving quickly.
// ---------------------------------------------------------------------------
export const syncDojahResult = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { referenceId } = req.body;
    if (!referenceId) return res.status(400).json({ success: false, message: 'referenceId required' });

    // Check current status first — if already approved/declined, nothing to do.
    const existing = await queryOne(
      `SELECT kyc_status AS "kycStatus",
              kyc_verified_data AS "kycVerifiedData"
       FROM public.profiles WHERE id = $1`,
      [userId],
    );
    const currentStatus = effectiveStoredKycStatus(existing?.kycStatus, existing?.kycVerifiedData);
    if (['approved', 'blocked_duplicate'].includes(currentStatus)) {
      return res.json({ success: true, kycStatus: currentStatus, source: 'db' });
    }

    // Store the sync reference for recovery. Do not mark as pending here:
    // timeout/error callbacks can reach this endpoint before Dojah confirms
    // that the user actually submitted verification.
    await query(
      `UPDATE public.profiles
       SET kyc_provider = 'dojah',
           kyc_verified_data = COALESCE(kyc_verified_data, '{}'::jsonb) || jsonb_build_object(
             'provider', 'dojah',
             'referenceId', $2,
             'reference_id', $2,
             'userId', $1,
             'syncStartedAt', timezone('utc', now())
           ),
           updated_at = NOW()
       WHERE id = $1 AND kyc_status NOT IN ('approved', 'blocked_duplicate', 'declined')`,
      [userId, referenceId],
    ).catch(() => {});

    let finalStatus = currentStatus || 'not_started';
    let source = 'db';

    // Actively pull the result from Dojah's API.
    if (DOJAH_APP_ID && DOJAH_SECRET) {
      try {
        const dojahResp = await fetchDojahVerificationByReference(referenceId);

        const event = dojahResp.data?.data ?? dojahResp.data;
        const rawStatus = firstWebhookValue(
          event?.status,
          event?.verificationStatus,
          event?.verification_status,
          event?.decision,
          event?.result,
          event?.verification?.status,
          event?.entity?.status,
          event?.entity?.verification_status,
          event?.entity?.verificationStatus,
          event?.data?.status,
          event?.data?.verification_status,
          event?.data?.verificationStatus,
          event?.data?.decision,
          event?.data?.result,
          dojahResp.data?.status,
        );

        console.log(`Dojah sync: referenceId=${referenceId} rawStatus=${rawStatus}`);

        const approved = isApprovedStatus(rawStatus);
        const pending = isPendingStatus(rawStatus);
        const declined = isDeclinedStatus(rawStatus);

        if (approved) {
          // Re-use webhook payload shape so identityFromPayload can find name/DOB.
          const webhookShape = {
            data: {
              ...event,
              metadata: {
                ...(event?.metadata || {}),
                userId,
                user_id: userId,
                referenceId,
                reference_id: referenceId,
              },
            },
            status: rawStatus,
            referenceId,
            reference_id: referenceId,
          };
          const approval = await markKycApproved(userId, { provider: 'dojah', kycVerifiedData: webhookShape });
          if (approval?.duplicate) {
            finalStatus = 'blocked_duplicate';
          } else {
            finalStatus = 'approved';
            // Notify user
            const userRow = await queryOne(
              `SELECT email, first_name FROM public.profiles WHERE id = $1`,
              [userId],
            ).catch(() => null);
            if (userRow?.email) {
              sendKycApprovedEmail(userRow.email, userRow.first_name || 'there').catch(() => {});
            }
            sendPushNotification(
              userId,
              'Identity Verified! ✅',
              'Your identity has been verified. You now have full access to all Bago features.',
              { type: 'kyc_approved' },
            ).catch(() => {});
          }
          source = 'dojah_api';
        } else if (declined) {
          const reason = event?.reason || event?.failureReason || 'Verification declined';
          await query(
            `UPDATE public.profiles
             SET kyc_status = 'declined',
                 kyc_provider = 'dojah',
                 kyc_failure_reason = $2,
                 kyc_verified_data = $3,
                 updated_at = NOW()
             WHERE id = $1`,
            [userId, reason, { data: event, status: rawStatus, referenceId }],
          );
          finalStatus = 'declined';
          source = 'dojah_api';
        } else if (pending) {
          await query(
            `UPDATE public.profiles
             SET kyc_status = 'pending',
                 kyc_provider = 'dojah',
                 kyc_verified_data = $3,
                 updated_at = NOW()
             WHERE id = $1 AND kyc_status NOT IN ('approved', 'blocked_duplicate', 'declined')`,
            [userId, referenceId, { data: event, status: rawStatus, referenceId }],
          ).catch(() => {});
          finalStatus = 'pending';
          source = 'dojah_api';
        }
      } catch (err) {
        // Dojah API unreachable or referenceId not yet indexed — webhook will handle it.
        console.log(`Dojah sync API call failed (webhook fallback active): ${err.message}`);
      }
    }

    return res.json({ success: true, kycStatus: finalStatus, source });
  } catch (err) {
    console.error('syncDojahResult error:', err);
    return res.status(500).json({ success: false, message: 'Failed to sync result' });
  }
};
