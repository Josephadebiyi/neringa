import axios from 'axios';
import { query } from '../lib/postgres/db.js';
import { findProfileById } from '../lib/postgres/profiles.js';
import { getTripById } from '../lib/postgres/shipping.js';
import { convertDeclaredValueToNgn } from './myCoverPricing.js';

export const MYCOVER_CAPPED_GIT_PRODUCT_ID =
  '4ca89151-78e9-4cda-9a3b-20f759f89a41';
const MYCOVER_PRODUCT_ID =
  process.env.MYCOVER_GIT_CAPPED_PRODUCT_ID || MYCOVER_CAPPED_GIT_PRODUCT_ID;

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

function findIdentityValue(value, keys, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return '';
  seen.add(value);
  for (const key of keys) {
    if (value[key] != null && String(value[key]).trim()) return value[key];
  }
  for (const nested of Object.values(value)) {
    const match = findIdentityValue(nested, keys, seen);
    if (match !== '') return match;
  }
  return '';
}

function normalizeGender(value) {
  if (value && typeof value === 'object') {
    for (const key of ['value', 'label', 'name', 'result']) {
      const normalized = normalizeGender(value[key]);
      if (normalized) return normalized;
    }
    return '';
  }
  const raw = cleanText(value).toLowerCase();
  if (['male', 'm'].includes(raw)) return 'Male';
  if (['female', 'f'].includes(raw)) return 'Female';
  return '';
}

function genderFromIdentity(value, seen = new Set()) {
  if (!value || typeof value !== 'object' || seen.has(value)) return '';
  seen.add(value);
  for (const [key, field] of Object.entries(value)) {
    if (['gender', 'sex'].includes(key.toLowerCase())) {
      const normalized = normalizeGender(field);
      if (normalized) return normalized;
    }
  }
  for (const nested of Object.values(value)) {
    const normalized = genderFromIdentity(nested, seen);
    if (normalized) return normalized;
  }
  return '';
}

function senderGender(sender, request) {
  return normalizeGender(sender?.gender) ||
    genderFromIdentity(sender?.kycVerifiedData || sender?.kyc_verified_data) ||
    normalizeGender(request?.insurancePolicyData?.customerDetails?.gender);
}

function senderDateOfBirth(sender) {
  const raw =
    sender?.verifiedDateOfBirth ||
    sender?.verified_date_of_birth ||
    sender?.dateOfBirth ||
    sender?.date_of_birth ||
    findIdentityValue(sender?.kycVerifiedData || sender?.kyc_verified_data, [
      'date_of_birth',
      'dateOfBirth',
      'dob',
      'birth_date',
    ]);
  if (!raw) return '';
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
}

// MyCover rejects plate numbers with anything other than letters and digits.
function alphanumeric(value) {
  return cleanText(value).replace(/[^a-z0-9]/gi, '');
}

// MyCover only accepts an absolute http(s) URL for the item image.
function imageUrl(value) {
  try {
    const url = new URL(cleanText(value));
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
  } catch {}
  return process.env.MYCOVER_DEFAULT_ITEM_IMAGE_URL || 'https://neringa.onrender.com/favicon.ico';
}

// Smallest item value MyCover accepts, in NGN.
export const MYCOVER_MIN_ITEM_VALUE_NGN = 5000;

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

export async function policyPayload({ request, sender, traveler }) {
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
  const declaredValue = Number(packageModel.value || request.amount || 0);
  const itemValue = Math.max(
    MYCOVER_MIN_ITEM_VALUE_NGN,
    Number(await convertDeclaredValueToNgn(declaredValue, request.currency || 'NGN')) || 0,
  );
  const itemImage = Array.isArray(packageModel.images)
    ? packageModel.images.find((image) => cleanText(image))
    : packageModel.image;
  const tracking = cleanText(request.trackingNumber || request.id);
  const gender = senderGender(sender, request);
  const dateOfBirth = senderDateOfBirth(sender);
  const phoneNumber = cleanText(sender?.phone || request.senderPhone);

  const missing = [];
  if (!cleanText(sender?.email || request.senderEmail)) missing.push('email');
  if (!phoneNumber) missing.push('phone_number');
  if (!gender) missing.push('gender');
  if (!dateOfBirth) missing.push('date_of_birth');
  if (missing.length) {
    throw Object.assign(new Error(`MyCover required sender fields are missing: ${missing.join(', ')}`), {code: 'INSURANCE_CUSTOMER_DETAILS_REQUIRED', missingFields: missing});
  }

  return {
    product_id: MYCOVER_PRODUCT_ID,
    first_name: senderName.firstName,
    last_name: senderName.lastName,
    email: cleanText(sender?.email || request.senderEmail),
    phone_number: phoneNumber,
    gender,
    date_of_birth: dateOfBirth,
    address: cleanText(packageModel.pickupAddress || fromRoute),
    pickup_location: fromRoute,
    drop_off_location: toRoute,
    shipping_date: isoDate(
      request.estimatedDeparture || request.trip?.departureDate || request.createdAt || undefined,
    ),
    // No real plate exists for most trips, so fall back to the sender's user id.
    vehicle_plate_number:
      alphanumeric(request.vehiclePlateNumber) ||
      alphanumeric(request.trip?.vehiclePlateNumber) ||
      alphanumeric(request.senderId || sender?.id || tracking) ||
      'BAGOSHIPMENT',
    vehicle_type: vehicleTypeFor(request),
    item_details: [
      {
        description: cleanText(
          packageModel.description || packageModel.category || 'Bago shipment item',
        ),
        value: itemValue,
        quantity: 1,
        image: imageUrl(itemImage),
      },
    ],
    item_value: itemValue,
    total_value: itemValue,
    bought_for_self: true,
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
      declared_value_currency: request.currency || null,
      insured_value_ngn: itemValue,
      insurance_cost: request.insuranceCost || 0,
      currency: request.currency || null,
    },
  };
}

function extractPolicy(responseData) {
  const policy = responseData?.data?.policy || responseData?.policy || {};
  const meta = policy.meta || responseData?.data?.meta || {};
  const essential = responseData?.data?.essential || {};
  return {
    policy,
    policyId:
      policy.id ||
      essential.policy_id ||
      responseData?.data?.policy_id ||
      responseData?.policy_id ||
      null,
    purchaseId:
      policy.purchase_id ||
      responseData?.data?.purchase_id ||
      responseData?.purchase_id ||
      responseData?.data?.id ||
      null,
    policyNumber:
      meta.policy_number ||
      meta?.data?.policy_number ||
      essential.policy_number ||
      policy.policy_number ||
      null,
    certificateUrl:
      meta.certificate_url ||
      meta?.data?.cert_url ||
      essential.certificate_url ||
      policy.certificate_url ||
      null,
  };
}

// True while a purchase may still be creating a policy. A shipment whose
// purchase MyCover rejected ('failed', no purchase id) can be retried.
export function isInsuranceSubmissionInFlight(status, data) {
  if (data?.purchaseId || data?.response) return true;
  if (status === 'failed') return false;
  return Boolean(data?.submittedAt || (status === 'pending_purchase' && data?.payload));
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
  if (!request?.id) throw new Error('Shipment request id is required');
  if (!request?.insurance || Number(request.insuranceCost || 0) <= 0) {
    await updateInsuranceState(request.id, { status: 'not_selected' });
    return null;
  }

  const existing = await query(`
    SELECT insurance_policy_id, insurance_policy_data, insurance_status
    FROM public.shipment_requests WHERE id = $1
  `, [request.id]);
  const stored = existing.rows?.[0];
  if (stored?.insurance_policy_id || request.insurancePolicyId) {
    return stored?.insurance_policy_id || request.insurancePolicyId;
  }
  const storedData = stored?.insurance_policy_data;
  if (isInsuranceSubmissionInFlight(stored?.insurance_status, storedData)) return null;

  const secretKey = process.env.MYCOVER_SECRET_KEY;
  if (!secretKey) {
    const error = 'MYCOVER_SECRET_KEY is not configured';
    await updateInsuranceState(request.id, { status: 'failed', error });
    console.warn(`MyCover: ${error}`);
    return null;
  }

  let payload;
  try {
    const [sender, traveler, trip] = await Promise.all([
      findProfileById(request.senderId),
      findProfileById(request.travelerId),
      request.tripId ? getTripById(request.tripId) : Promise.resolve(request.trip),
    ]);
    if (!sender) throw new Error(`Sender profile not found for id ${request.senderId}`);
    payload = await policyPayload({ request: { ...request, insurancePolicyData: stored?.insurance_policy_data || request.insurancePolicyData, trip }, sender, traveler });
  } catch (error) {
    await updateInsuranceState(request.id, { status: 'failed', error: error.message });
    throw error;
  }

  const attempts = Number(storedData?.attempts || 0) + 1;

  // A durable claim prevents concurrent acceptance requests (or a repeat after
  // a timeout) from buying a second policy against the funded wallet.
  const claimed = await query(`
    UPDATE public.shipment_requests
    SET insurance_status = 'pending_purchase', insurance_error = NULL,
        insurance_policy_data = $2::jsonb, updated_at = timezone('utc', now())
    WHERE id = $1 AND NULLIF(insurance_policy_id, '') IS NULL
      AND (insurance_policy_data->>'submittedAt' IS NULL OR insurance_status = 'failed')
    RETURNING id
  `, [request.id, JSON.stringify({ provider: 'mycover', payload, submittedAt: new Date().toISOString(), attempts })]);
  if (!claimed.rows?.length) return null;

  let responseData;
  try {
    const baseUrl = process.env.MYCOVER_API_URL || 'https://api.mycover.ai';
    const path = process.env.MYCOVER_GIT_PATH || '/v1/products/sti/buy-git-ondemand';
    const url = `${baseUrl.replace(/\/$/, '')}${path}`;
    const { data } = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
    responseData = data;
    if (data?.responseCode === 0 || data?.success === false) {
      const rejection = new Error(data.responseText || data.message || 'Policy purchase rejected');
      rejection.response = { data, status: 400 };
      throw rejection;
    }
  } catch (err) {
    const detail = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    // A MyCover response means no policy was created, so the shipment can be
    // retried. With no response (timeout, network) the policy may exist, so
    // it stays submitted until MyCover's webhook confirms either way.
    const rejected = Boolean(err.response);
    await updateInsuranceState(request.id, {
      status: rejected ? 'failed' : 'pending_purchase',
      error: detail,
      policyData: {
        provider: 'mycover', payload, attempts,
        ...(rejected ? { failedAt: new Date().toISOString() } : { submittedAt: new Date().toISOString() }),
        error: err.response?.data || err.message,
      },
    });
    throw new Error(`MyCover API error: ${detail}`);
  }

  const extracted = extractPolicy(responseData);
  const policyData = {
    provider: 'mycover',
    submittedAt: new Date().toISOString(),
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
