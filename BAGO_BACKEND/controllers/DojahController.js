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
    const userId =
      event?.data?.entity?.userId ||
      event?.data?.entity?.user_id ||
      event?.data?.metadata?.userId ||
      event?.data?.metadata?.user_id ||
      event?.data?.referenceId ||
      event?.data?.reference_id ||
      event?.referenceId ||
      event?.reference_id ||
      // sandbox sometimes puts it at the top level
      event?.data?.entity?.id;

    if (!userId) {
      console.warn('Dojah webhook: no userId found in payload');
      return res.status(200).json({ received: true, note: 'no userId in payload' });
    }

    const approved = ['success', 'approved', 'verified', 'completed'].includes(rawStatus);
    const declined = ['failed', 'declined', 'rejected', 'failure'].includes(rawStatus);

    if (approved) {
      await markKycApproved(userId, { provider: 'dojah', kycVerifiedData: event });
      console.log(`Dojah webhook: approved userId=${userId}`);
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
