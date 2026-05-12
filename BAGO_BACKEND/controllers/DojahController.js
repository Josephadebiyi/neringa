import axios from 'axios';
import { query, queryOne } from '../lib/postgres/db.js';
import { markKycApproved } from '../lib/postgres/accounts.js';

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

  // Non-Dojah country — use in-app manual review flow
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

    // Mark user as having a pending KYC via Dojah
    await query(
      `UPDATE public.profiles
       SET kyc_status = 'pending', kyc_provider = 'dojah', updated_at = NOW()
       WHERE id = $1`,
      [userId],
    ).catch(() => {}); // non-fatal if column doesn't exist yet

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

    if (status === 'success' || status === 'approved' || status === 'verified') {
      await markKycApproved(userId, { provider: 'dojah', kycVerifiedData: event });
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
