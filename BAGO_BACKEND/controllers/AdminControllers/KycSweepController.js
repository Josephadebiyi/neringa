import fetch from 'node-fetch';
import { query, queryOne } from '../../lib/postgres/db.js';
import { sendPushNotification } from '../../services/pushNotificationService.js';
import { sendKycApprovedEmail } from '../../services/emailNotifications.js';

const DIDIT_API_KEY = process.env.DIDIT_API_KEY;

export async function runKycSweep(req, res) {
  if (!DIDIT_API_KEY) {
    return res.status(503).json({ success: false, message: 'DIDIT_API_KEY not configured' });
  }

  try {
    const pending = await query(
      `SELECT id, email, first_name, last_name, didit_session_id
       FROM public.profiles
       WHERE kyc_status = 'pending' AND didit_session_id IS NOT NULL`
    );

    const results = { approved: [], declined: [], unchanged: [], errors: [] };

    for (const user of pending.rows) {
      try {
        const r = await fetch(`https://verification.didit.me/v3/session/${user.didit_session_id}`, {
          headers: { accept: 'application/json', 'x-api-key': DIDIT_API_KEY },
        });

        if (!r.ok) {
          results.errors.push({ id: user.id, email: user.email, reason: `DIDIT HTTP ${r.status}` });
          continue;
        }

        const d = await r.json();
        const s = (d.status || '').toLowerCase();
        const docData = d.document_data || d.extracted_data || d.kyc?.document || {};
        const firstName = docData.first_name || docData.firstName || docData.given_name || '';
        const lastName  = docData.last_name  || docData.lastName  || docData.family_name || '';
        const dob       = docData.date_of_birth || docData.dateOfBirth || null;

        if (s === 'approved') {
          const setParts = [`kyc_status='approved'`, `kyc_verified_at=NOW()`, `updated_at=NOW()`];
          const vals = [user.id];
          if (firstName) { setParts.push(`first_name=$${vals.length + 1}`); vals.push(firstName); }
          if (lastName)  { setParts.push(`last_name=$${vals.length + 1}`);  vals.push(lastName); }
          if (dob)       { setParts.push(`date_of_birth=$${vals.length + 1}`); vals.push(new Date(dob)); }
          await query(`UPDATE public.profiles SET ${setParts.join(', ')} WHERE id=$1`, vals);
          await sendPushNotification(user.id, 'Identity Verified!', 'Your identity has been verified. You now have full access to all Bago features.').catch(() => {});
          const name = `${firstName || user.first_name || ''} ${lastName || user.last_name || ''}`.trim();
          await sendKycApprovedEmail(user.email, name || user.email).catch(() => {});
          results.approved.push({ id: user.id, email: user.email });
        } else if (s === 'declined' || s === 'rejected') {
          await queryOne(
            `UPDATE public.profiles SET kyc_status='declined', updated_at=NOW() WHERE id=$1`,
            [user.id]
          );
          results.declined.push({ id: user.id, email: user.email });
        } else {
          results.unchanged.push({ id: user.id, email: user.email, status: s });
        }
      } catch (err) {
        results.errors.push({ id: user.id, email: user.email, reason: err.message });
      }
    }

    res.json({ success: true, total: pending.rows.length, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
