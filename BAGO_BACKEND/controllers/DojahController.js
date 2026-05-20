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

// ---------------------------------------------------------------------------
// GET /api/bago/kyc/provider?country=NG
// Returns which provider to use + config the client needs
// ---------------------------------------------------------------------------
export const getKycProvider = async (req, res) => {
  const country = (req.query.country || req.body?.country || '').toUpperCase().trim();
  if (!country) {
    return res.status(400).json({ success: false, message: 'country is required' });
  }

  if (DOJAH_COUNTRIES.has(country)) {
    if (!DOJAH_APP_ID || !DOJAH_PUBLIC_KEY) {
      // Fall back to manual if Dojah keys not configured
      return res.json({ success: true, provider: 'manual', country });
    }
    return res.json({
      success: true,
      provider: 'dojah',
      country,
      appId: DOJAH_APP_ID,
      publicKey: DOJAH_PUBLIC_KEY,
    });
  }

  // Non-Dojah country — use in-app manual review flow (Didit disabled)
  return res.json({ success: true, provider: 'manual', country });
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
      userId,
    });
  } catch (err) {
    console.error('startDojahSession error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ---------------------------------------------------------------------------
// POST /api/bago/kyc/dojah/webhook
// Dojah calls this when verification completes
// ---------------------------------------------------------------------------
export const dojahWebhook = async (req, res) => {
  try {
    const event = req.body;
    console.log('Dojah webhook received:', JSON.stringify(event).slice(0, 300));

    // Dojah sends: { type, data: { referenceId, status, entity: { userId } } }
    const status = (event?.data?.status || event?.status || '').toLowerCase();
    const userId  =
      event?.data?.entity?.userId ||
      event?.data?.entity?.user_id ||
      event?.data?.metadata?.userId ||
      event?.data?.metadata?.user_id ||
      event?.data?.referenceId;

    if (!userId) {
      return res.status(200).json({ received: true, note: 'no userId in payload' });
    }

    // Fetch user profile for notifications
    const userRow = await queryOne(
      `SELECT email, first_name, last_name FROM public.profiles WHERE id = $1`,
      [userId],
    ).catch(() => null);
    const userEmail = userRow?.email;
    const userName = [userRow?.first_name, userRow?.last_name].filter(Boolean).join(' ') || 'there';

    if (status === 'success' || status === 'approved' || status === 'verified') {
      await markKycApproved(userId, { provider: 'dojah', kycVerifiedData: event });
      if (userEmail) {
        sendKycApprovedEmail(userEmail, userName).catch(() => {});
      }
      sendPushNotification(
        userId,
        'Identity Verified! ✅',
        'Your identity has been verified. You now have full access to all Bago features.',
        { type: 'kyc_approved' },
      ).catch(() => {});
    } else if (status === 'pending' || status === 'submitted' || status === 'review') {
      await query(
        `UPDATE public.profiles
         SET kyc_status = 'pending', kyc_provider = 'dojah', updated_at = NOW()
         WHERE id = $1`,
        [userId],
      ).catch(() => {});
      if (userEmail) {
        sendKycSubmittedEmail(userEmail, userName).catch(() => {});
      }
      sendPushNotification(
        userId,
        'Verification Under Review ⏳',
        'Your identity verification has been submitted and is being reviewed. We\'ll notify you once it\'s approved.',
        { type: 'kyc_pending' },
      ).catch(() => {});
    } else if (status === 'failed' || status === 'declined' || status === 'rejected') {
      await query(
        `UPDATE public.profiles
         SET kyc_status = 'declined',
             kyc_failure_reason = 'Dojah verification declined',
             updated_at = NOW()
         WHERE id = $1`,
        [userId],
      );
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('dojahWebhook error:', err);
    res.status(200).json({ received: true, error: err.message });
  }
};
