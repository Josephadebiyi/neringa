import axios from 'axios';
import { query } from '../lib/postgres/db.js';
import { findProfileById } from '../lib/postgres/profiles.js';

const MYCOVER_SECRET_KEY = process.env.MYCOVER_SECRET_KEY;
const MYCOVER_PRODUCT_ID =
  process.env.MYCOVER_GIT_PRODUCT_ID || process.env.MYCOVER_PRODUCT_ID;
const MYCOVER_BASE_URL =
  process.env.MYCOVER_API_URL || 'https://api.mycover.ai';
const MYCOVER_GIT_PATH =
  process.env.MYCOVER_GIT_PATH || '/v1/products/sti/buy-git-ondemand';

function isoDate(value, fallback = new Date()) {
  const date = value ? new Date(value) : fallback;
  if (Number.isNaN(date.getTime())) return isoDate(fallback);
  return date.toISOString().split('T')[0];
}

function cleanText(value, fallback = '') {
  const text = value == null ? '' : String(value).trim();
  return text || fallback;
}

function splitName(profile, fallbackName = '') {
  const first = cleanText(profile?.firstName);
  const last = cleanText(profile?.lastName);
  if (first || last) {
    return {
      firstName: first || 'Bago',
      lastName: last || 'User',
    };
  }
  const parts = cleanText(fallbackName, 'Bago User').split(/\s+/);
  return {
    firstName: parts[0] || 'Bago',
    lastName: parts.slice(1).join(' ') || 'User',
  };
}

function vehicleTypeFor(request) {
  const raw = cleanText(
    request.trip?.travelMeans ||
      request.travelMeans ||
      request.paymentInfo?.travelMeans ||
      '',
  ).toLowerCase();
  if (raw.includes('plane') || raw.includes('flight') || raw.includes('air')) {
    return 'Air Plane';
  }
  if (raw.includes('bus')) return 'Bus';
  if (raw.includes('motor')) return 'Motorcycle';
  if (raw.includes('tricycle') || raw.includes('keke')) return 'Tricycle';
  if (raw.includes('truck')) return 'Truck';
  return process.env.MYCOVER_DEFAULT_VEHICLE_TYPE || 'Car';
}

function policyPayload({ request, sender, traveler }) {
  const senderName = splitName(sender, request.senderName);
  const packageModel = request.package || {};
  const fromRoute =
    [packageModel.pickupAddress, packageModel.fromCity, packageModel.fromCountry]
      .map((value) => cleanText(value))
      .filter(Boolean)
      .join(', ') ||
    [request.fromLocation, request.originCountry].filter(Boolean).join(', ') ||
    'Bago pickup';
  const toRoute =
    [packageModel.deliveryAddress, packageModel.toCity, packageModel.toCountry]
      .map((value) => cleanText(value))
      .filter(Boolean)
      .join(', ') ||
    [request.toLocation, request.destinationCountry].filter(Boolean).join(', ') ||
    'Bago delivery';
  const declaredValue = Number(packageModel.value || request.insuranceCost || 0);
  const itemValue = Math.max(1, Math.round(declaredValue || request.amount || 1));
  const itemImage = Array.isArray(packageModel.images)
    ? packageModel.images.find((image) => cleanText(image))
    : packageModel.image;
  const tracking = cleanText(request.trackingNumber || request.id);

  return {
    product_id: MYCOVER_PRODUCT_ID,
    first_name: senderName.firstName,
    last_name: senderName.lastName,
    email: cleanText(sender?.email || request.senderEmail),
    phone_number: cleanText(sender?.phone || '0000000000'),
    address: cleanText(packageModel.pickupAddress || fromRoute),
    pickup_location: fromRoute,
    drop_off_location: toRoute,
    shipping_date: isoDate(
      request.estimatedDeparture || request.createdAt || undefined,
    ),
    vehicle_plate_number: cleanText(
      request.vehiclePlateNumber ||
        request.trip?.vehiclePlateNumber ||
        `BAGO-${tracking}`.replace(/[^a-z0-9-]/gi, '').slice(0, 20),
      'BAGO-SHIPMENT',
    ),
    vehicle_type: vehicleTypeFor(request),
    item_value: itemValue,
    item_details: [
      {
        description: cleanText(
          packageModel.description || packageModel.category || 'Bago shipment item',
        ),
        value: itemValue,
        quantity: 1,
        image: cleanText(itemImage, 'https://neringa.onrender.com/favicon.ico'),
      },
    ],
    metadata: {
      request_id: request.id,
      tracking_number: request.trackingNumber || null,
      trip_id: request.tripId,
      package_id: request.packageId,
      sender_id: request.senderId,
      traveler_id: request.travelerId,
      sender_kyc_status: sender?.kycStatus || null,
      traveler_kyc_status: traveler?.kycStatus || null,
      traveler_name:
        cleanText(`${traveler?.firstName || ''} ${traveler?.lastName || ''}`) ||
        request.travelerName ||
        request.carrierName ||
        null,
      traveler_email: traveler?.email || request.travelerEmail || null,
      traveler_phone: traveler?.phone || null,
      receiver_name: packageModel.receiverName || null,
      receiver_phone: packageModel.receiverPhone || null,
      package_weight: packageModel.packageWeight || request.packageWeight || null,
      category: packageModel.category || null,
      declared_value: packageModel.value || null,
      insurance_cost: request.insuranceCost || 0,
      currency: request.currency || null,
    },
  };
}

function extractPolicy(responseData) {
  const policy = responseData?.data?.policy || responseData?.policy || {};
  const meta = policy.meta || responseData?.data?.meta || {};
  return {
    policy,
    policyId:
      policy.id ||
      responseData?.data?.policy_id ||
      responseData?.policy_id ||
      responseData?.data?.id ||
      null,
    purchaseId:
      policy.purchase_id ||
      responseData?.data?.purchase_id ||
      responseData?.purchase_id ||
      null,
    policyNumber:
      meta.policy_number ||
      meta?.data?.policy_number ||
      policy.policy_number ||
      null,
    certificateUrl:
      meta.certificate_url ||
      meta?.data?.cert_url ||
      policy.certificate_url ||
      null,
  };
}

async function updateInsuranceState(requestId, fields) {
  await query(
    `
      UPDATE public.shipment_requests
      SET insurance_status = $2,
          insurance_policy_id = COALESCE($3, insurance_policy_id),
          insurance_policy_data = COALESCE($4, insurance_policy_data),
          insurance_error = $5,
          insurance_purchased_at = COALESCE($6, insurance_purchased_at),
          updated_at = timezone('utc', now())
      WHERE id = $1
    `,
    [
      requestId,
      fields.status,
      fields.policyId || null,
      fields.policyData ? JSON.stringify(fields.policyData) : null,
      fields.error || null,
      fields.purchasedAt || null,
    ],
  );
}

/**
 * Purchases a documented MyCover.ai Goods-in-Transit On-demand policy.
 * This is intentionally non-blocking for shipment acceptance; callers should
 * show insurance_status instead of assuming protection is active.
 */
export async function purchaseMyCoverPolicy(request) {
  if (!request?.insurance || Number(request.insuranceCost || 0) <= 0) {
    await updateInsuranceState(request.id, { status: 'not_selected' });
    return null;
  }

  if (!MYCOVER_SECRET_KEY || !MYCOVER_PRODUCT_ID) {
    const error = 'MYCOVER_SECRET_KEY or MYCOVER_GIT_PRODUCT_ID is not configured';
    await updateInsuranceState(request.id, { status: 'failed', error });
    console.warn(`MyCover: ${error}`);
    return null;
  }

  if (request.insurancePolicyId) {
    await updateInsuranceState(request.id, {
      status: 'active',
      policyId: request.insurancePolicyId,
      purchasedAt: new Date(),
    });
    return request.insurancePolicyId;
  }

  await updateInsuranceState(request.id, { status: 'pending_purchase' });

  const [sender, traveler] = await Promise.all([
    findProfileById(request.senderId),
    findProfileById(request.travelerId),
  ]);
  if (!sender) {
    const error = `Sender profile not found for id ${request.senderId}`;
    await updateInsuranceState(request.id, { status: 'failed', error });
    throw new Error(`MyCover: ${error}`);
  }

  const payload = policyPayload({ request, sender, traveler });

  let responseData;
  try {
    const url = `${MYCOVER_BASE_URL.replace(/\/$/, '')}${MYCOVER_GIT_PATH}`;
    const { data } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${MYCOVER_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    responseData = data;
  } catch (err) {
    const detail = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    await updateInsuranceState(request.id, {
      status: 'failed',
      error: detail,
      policyData: { payload, error: err.response?.data || err.message },
    });
    throw new Error(`MyCover API error: ${detail}`);
  }

  const extracted = extractPolicy(responseData);
  const policyData = {
    provider: 'mycover',
    payload,
    response: responseData,
    purchaseId: extracted.purchaseId,
    policyNumber: extracted.policyNumber,
    certificateUrl: extracted.certificateUrl,
  };

  await updateInsuranceState(request.id, {
    status: extracted.policyId ? 'active' : 'pending_purchase',
    policyId: extracted.policyId,
    policyData,
    purchasedAt: extracted.policyId ? new Date() : null,
  });

  console.log(
    `MyCover: policy purchase response for request ${request.id} — policy id: ${extracted.policyId || 'pending'}`,
  );
  return extracted.policyId;
}
