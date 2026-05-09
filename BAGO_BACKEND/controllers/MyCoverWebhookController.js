import { query, queryOne } from '../lib/postgres/db.js';
import { sendPushNotification } from '../services/pushNotificationService.js';

// POST /api/bago/insurance/mycover/webhook
// Called by MyCover.ai when policy status changes. No auth — verified by shared secret.
export const myCoverWebhook = async (req, res) => {
  try {
    // Verify shared secret if configured
    const secret = process.env.MYCOVER_WEBHOOK_SECRET;
    if (secret) {
      const incomingSecret = req.headers['x-mycover-secret'] || req.headers['x-webhook-secret'];
      if (incomingSecret !== secret) {
        return res.status(401).json({ success: false, message: 'Invalid webhook secret' });
      }
    }

    const { event, data } = req.body || {};
    if (!event || !data) {
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }

    const policyId = data.id || data.policy_id;
    if (!policyId) {
      return res.status(200).json({ success: true, message: 'No policy_id in payload — ignored' });
    }

    // Find the request with this policy
    const request = await queryOne(
      `SELECT id, sender_id, insurance_policy_data FROM public.shipment_requests WHERE insurance_policy_id = $1`,
      [policyId]
    );

    if (!request) {
      // Policy not found in our DB — acknowledge so MyCover stops retrying
      return res.status(200).json({ success: true, message: 'Policy not found — acknowledged' });
    }

    // Merge the new event data into the stored policy data
    const existing = request.insurance_policy_data || {};
    const merged = { ...existing, lastEvent: event, lastEventData: data, lastEventAt: new Date().toISOString() };

    await query(
      `UPDATE public.shipment_requests SET insurance_policy_data = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(merged), request.id]
    );

    // Notify the sender on meaningful events
    const notifyEvents = ['policy.issued', 'policy.activated', 'policy.cancelled', 'claim.approved', 'claim.declined'];
    if (notifyEvents.includes(event) && request.sender_id) {
      const titleMap = {
        'policy.issued':    'Insurance Policy Issued',
        'policy.activated': 'Item Protection Active',
        'policy.cancelled': 'Insurance Cancelled',
        'claim.approved':   'Claim Approved',
        'claim.declined':   'Claim Declined',
      };
      const bodyMap = {
        'policy.issued':    'Your item protection policy has been issued.',
        'policy.activated': 'Your item is now covered in transit.',
        'policy.cancelled': 'Your item protection policy was cancelled.',
        'claim.approved':   'Your insurance claim has been approved.',
        'claim.declined':   'Your insurance claim was not approved.',
      };
      sendPushNotification(
        request.sender_id,
        titleMap[event] || 'Insurance Update',
        bodyMap[event] || `Policy event: ${event}`,
        { type: 'insurance_update', event, policyId }
      ).catch(() => {});
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('MyCover webhook error:', err);
    // Return 200 to prevent MyCover from retrying on our server errors
    return res.status(200).json({ success: true });
  }
};
