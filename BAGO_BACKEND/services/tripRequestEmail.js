import { withTransaction } from '../lib/postgres/db.js';
import { sendNewRequestToTravelerEmail } from './emailNotifications.js';

// Serialize app/webhook retries and remember delivery independently of booking
// creation. Resend also deduplicates an accepted send if the DB write fails.
export async function notifyTripOwnerByEmail({ request, owner, packageDetails, trip }) {
  return withTransaction(async (client) => {
    const result = await client.query(
      'select payment_info from public.shipment_requests where id = $1 for update',
      [request.id],
    );
    const row = result.rows[0];
    if (!row) throw new Error('Shipment request not found for trip-owner email.');
    if (row.payment_info?.tripOwnerEmailSentAt) return true;
    const email = owner?.email || request.traveler?.email || request.travelerEmail;
    if (!email) throw new Error('Trip owner has no email address.');
    const sent = await sendNewRequestToTravelerEmail(
      email, request.travelerName || owner?.firstName || 'Traveler',
      request.senderName || 'Sender', packageDetails, trip, request.id,
    );
    if (!sent) return false;
    await client.query(
      `update public.shipment_requests
       set payment_info = coalesce(payment_info, '{}'::jsonb) || jsonb_build_object('tripOwnerEmailSentAt', timezone('utc', now())),
           updated_at = timezone('utc', now()) where id = $1`,
      [request.id],
    );
    return true;
  });
}
