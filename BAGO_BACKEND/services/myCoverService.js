import axios from 'axios';
import { query, queryOne } from '../lib/postgres/db.js';
import { findProfileById } from '../lib/postgres/profiles.js';

const MYCOVER_SECRET_KEY = process.env.MYCOVER_SECRET_KEY;
const MYCOVER_PRODUCT_ID = process.env.MYCOVER_PRODUCT_ID;
const MYCOVER_API_URL = process.env.MYCOVER_API_URL || 'https://v2.api.mycover.ai';

function isoDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Purchases a MyCover.ai goods-in-transit policy for an accepted shipment.
 * Called fire-and-forget after traveler accepts — failures are logged but don't
 * block the acceptance flow.
 *
 * @param {object} request - Normalised request object from updateShipmentRequestStatus
 */
export async function purchaseMyCoverPolicy(request) {
  if (!MYCOVER_SECRET_KEY || !MYCOVER_PRODUCT_ID) {
    console.warn('MyCover: MYCOVER_SECRET_KEY or MYCOVER_PRODUCT_ID not set — skipping policy purchase');
    return;
  }

  if (request.insurancePolicyId) {
    console.log(`MyCover: policy already exists for request ${request.id} — skipping`);
    return request.insurancePolicyId;
  }

  const sender = await findProfileById(request.senderId);
  if (!sender) throw new Error(`MyCover: sender profile not found for id ${request.senderId}`);

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 30);

  const payload = {
    product_id: MYCOVER_PRODUCT_ID,
    first_name: sender.firstName || request.senderName?.split(' ')[0] || 'N/A',
    last_name: sender.lastName || request.senderName?.split(' ').slice(1).join(' ') || 'N/A',
    email: sender.email || request.senderEmail,
    phone: sender.phone || '',
    start_date: isoDate(today),
    end_date: isoDate(endDate),
    // Bago uses human travelers, not vehicles. These fields are required by the
    // MyCover API schema but have no meaning for peer-to-peer travel shipments.
    vehicle_type: 'others',
    vehicle_plate_number: 'N/A',
    amount: Math.round((request.package?.value || request.insuranceCost || 0) * 100),
    description: request.package?.description || 'Goods in transit',
    currency: request.currency || 'NGN',
  };

  let responseData;
  try {
    const { data } = await axios.post(
      `${MYCOVER_API_URL}/v2/products/buy`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${MYCOVER_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );
    responseData = data;
  } catch (err) {
    const detail = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`MyCover API error: ${detail}`);
  }

  const policyId = responseData?.data?.id
    || responseData?.data?.policy_id
    || responseData?.policy_id
    || null;

  await query(
    `UPDATE public.shipment_requests
     SET insurance_policy_id = $1,
         insurance_policy_data = $2,
         updated_at = NOW()
     WHERE id = $3`,
    [policyId, JSON.stringify(responseData), request.id]
  );

  console.log(`MyCover: policy purchased for request ${request.id} — policy id: ${policyId}`);
  return policyId;
}
