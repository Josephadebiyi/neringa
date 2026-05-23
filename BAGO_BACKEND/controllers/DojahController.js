import axios from 'axios';
import { query, queryOne } from '../lib/postgres/db.js';
import { markKycApproved } from '../lib/postgres/accounts.js';
import { sendKycApprovedEmail, sendKycSubmittedEmail } from '../services/emailNotifications.js';
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
const DOJAH_WIDGET_NG_KE = process.env.DOJAH_WIDGET_NG_KE || process.env.DOJAH_WIDGET_ID_NG_KE || '';
const DOJAH_WIDGET_GLOBAL = process.env.DOJAH_WIDGET_GLOBAL || process.env.DOJAH_WIDGET_ID_GLOBAL || process.env.DOJAH_WIDGET_ID || '';

const countryNeedsLocalGovWidget = (country = '') => {
  const code = country.toUpperCase().trim();
  return code === 'NG' || code === 'KE';
};

const widgetConfigForCountry = (country = '', clientWidgetId = '') => {
  const code = country.toUpperCase().trim();
  const clientId = clientWidgetId.toString().trim();

  if (countryNeedsLocalGovWidget(code)) {
    const widgetId = DOJAH_WIDGET_NG_KE || clientId;
    return {
      widgetId,
      widgetSource: DOJAH_WIDGET_NG_KE ? 'server:DOJAH_WIDGET_NG_KE' : 'client',
      missingEnv: !widgetId ? 'DOJAH_WIDGET_NG_KE' : null,
    };
  }

  const widgetId = DOJAH_WIDGET_GLOBAL || clientId || DOJAH_WIDGET_NG_KE;
  return {
    widgetId,
    widgetSource: DOJAH_WIDGET_GLOBAL ? 'server:DOJAH_WIDGET_GLOBAL' : (clientId ? 'client' : 'server:DOJAH_WIDGET_NG_KE'),
    missingEnv: !widgetId ? 'DOJAH_WIDGET_GLOBAL' : null,
  };
};

const userIdFromReferenceId = (referenceId = '') => {
  const value = referenceId.toString().trim();
  const match = value.match(/^bago-(.+)-\d+$/);
  return match?.[1] || value;
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
// Records that user started Dojah KYC, returns widget config
// ---------------------------------------------------------------------------
export const startDojahSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    if (!DOJAH_APP_ID || !DOJAH_PUBLIC_KEY) {
      return res.status(503).json({ success: false, message: 'Dojah is not configured on the server' });
    }

    const country = (req.body?.country || req.query?.country || '').toUpperCase().trim();
    const widgetConfig = widgetConfigForCountry(country, req.body?.widgetId);
    const widgetId = widgetConfig.widgetId;

    if (!widgetId) {
      return res.status(503).json({
        success: false,
        message: `Dojah widget is not configured for ${country || 'this country'}. Set ${widgetConfig.missingEnv}.`,
      });
    }

    // Record that this user is using Dojah — do NOT set kyc_status here.
    // Status is only updated once Dojah fires the webhook with an actual result.
    await query(
      `UPDATE public.profiles
       SET kyc_provider = 'dojah', updated_at = NOW()
       WHERE id = $1`,
      [userId],
    ).catch(() => {});

    return res.json({
      success: true,
      provider: 'dojah',
      appId: DOJAH_APP_ID,
      publicKey: DOJAH_PUBLIC_KEY,
      country,
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
    const rawStatus = (
      event?.data?.status ||
      event?.data?.verificationStatus ||
      event?.data?.verification_status ||
      event?.status ||
      event?.verification_status ||
      event?.verificationStatus ||
      ''
    ).toLowerCase().trim();

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
    const userId = userIdFromReferenceId(rawUserId);

    if (!userId) {
      console.warn('Dojah webhook: no userId found in payload');
      return res.status(200).json({ received: true, note: 'no userId in payload' });
    }

    // Fetch user profile for notifications
    const userRow = await queryOne(
      `SELECT email, first_name, last_name FROM public.profiles WHERE id = $1`,
      [userId],
    ).catch(() => null);
    const userEmail = userRow?.email;
    const userName = [userRow?.first_name, userRow?.last_name].filter(Boolean).join(' ') || 'there';

    const approved = ['success', 'approved', 'verified', 'completed'].includes(rawStatus);
    const pending  = ['pending', 'submitted', 'review', 'manual_review'].includes(rawStatus);
    const declined = ['failed', 'declined', 'rejected', 'failure'].includes(rawStatus);

    if (approved) {
      await markKycApproved(userId, { provider: 'dojah', kycVerifiedData: event });
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
         SET kyc_status = 'pending', kyc_provider = 'dojah', updated_at = NOW()
         WHERE id = $1`,
        [userId],
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
             kyc_failure_reason = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [userId, reason],
      );
      console.log(`Dojah webhook: declined userId=${userId} reason=${reason}`);
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
              kyc_failure_reason AS "kycFailureReason"
       FROM public.profiles WHERE id = $1`,
      [userId],
    );

    if (!row) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, kycStatus: row.kycStatus, kycProvider: row.kycProvider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
