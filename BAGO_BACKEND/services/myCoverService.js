import axios from 'axios';
import { query } from '../lib/postgres/db.js';
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

  const [sender, traveler] = await Promise.all([
    findProfileById(request.senderId),
    findProfileById(request.travelerId),
  ]);
  if (!sender) throw new Error(`MyCover: sender profile not found for id ${request.senderId}`);

  const today = new Date();
  // Policy covers from acceptance through estimated arrival + 7-day buffer
  const endDate = request.estimatedArrival
    ? new Date(new Date(request.estimatedArrival).getTime() + 7 * 24 * 60 * 60 * 1000)
    : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  const fromRoute = [request.package?.fromCity, request.package?.fromCountry].filter(Boolean).join(', ') || 'N/A';
  const toRoute = [request.package?.toCity, request.package?.toCountry].filter(Boolean).join(', ') || 'N/A';
  const shipmentDescription = [
    request.package?.description || 'Goods in transit',
    `Route: ${fromRoute} → ${toRoute}`,
    request.trackingNumber ? `Ref: ${request.trackingNumber}` : null,
    `Weight: ${request.package?.packageWeight || 0}kg`,
  ].filter(Boolean).join(' | ');

  const payload = {
    product_id: MYCOVER_PRODUCT_ID,
    // Primary policyholder — sender
    first_name: sender.firstName || request.senderName?.split(' ')[0] || 'N/A',
    last_name: sender.lastName || request.senderName?.split(' ').slice(1).join(' ') || 'N/A',
    email: sender.email || request.senderEmail,
    phone: sender.phone || '',
    // Carrier / traveler details
    carrier_first_name: traveler?.firstName || request.travelerName?.split(' ')[0] || 'N/A',
    carrier_last_name: traveler?.lastName || request.travelerName?.split(' ').slice(1).join(' ') || 'N/A',
    carrier_email: traveler?.email || request.travelerEmail || '',
    carrier_phone: traveler?.phone || '',
    start_date: isoDate(today),
    end_date: isoDate(endDate),
    // Bago uses human travelers, not vehicles. These fields are required by the
    // MyCover API schema but have no meaning for peer-to-peer travel shipments.
    vehicle_type: 'others',
    vehicle_plate_number: 'N/A',
    amount: Math.round((request.package?.value || request.insuranceCost || 0) * 100),
    description: shipmentDescription,
    currency: request.currency || 'NGN',
    // Additional metadata for MyCover's records
    metadata: {
      requestId: request.id,
      trackingNumber: request.trackingNumber,
      fromRoute,
      toRoute,
      packageWeight: request.package?.packageWeight,
      declaredValue: request.package?.value,
      senderEmail: sender.email,
      carrierEmail: traveler?.email,
    },
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
