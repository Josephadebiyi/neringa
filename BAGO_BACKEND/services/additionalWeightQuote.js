import { buildTripCapacitySnapshot } from '../lib/postgres/tripCapacity.js';
import { query, queryOne } from '../lib/postgres/db.js';
import { buildShipmentCheckoutPreview } from '../controllers/CurrencyController.js';

export async function buildAdditionalWeightQuote({requestId, senderId, additionalKg, currency}) {
  const row = await queryOne(`select sr.*, p.package_weight from public.shipment_requests sr
    join public.packages p on p.id = sr.package_id where sr.id = $1 and sr.sender_id = $2`, [requestId, senderId]);
  if (!row) throw Object.assign(new Error('Shipment not found.'), {statusCode: 404});
  if (!['pending', 'accepted', 'accepted_awaiting_inspection', 'inspection_in_progress', 'inspection_completed', 'approved_for_trip'].includes(row.status) || row.fast_payout_released_at) {
    throw Object.assign(new Error('Additional weight can only be purchased before the trip starts.'), {statusCode: 409});
  }
  if (!Number.isFinite(Number(additionalKg)) || Number(additionalKg) <= 0) throw Object.assign(new Error('Additional kg must be greater than zero.'), {statusCode: 400});
  if (currency && String(currency).toUpperCase() !== row.currency.toUpperCase()) throw Object.assign(new Error('Use the shipment payment currency.'), {statusCode: 409});
  const capacity = await buildTripCapacitySnapshot({query}, row.trip_id);
  if (!capacity || Number(additionalKg) > capacity.availableKg) throw Object.assign(new Error('This trip does not have enough space left.'), {statusCode: 409});
  const quote = await buildShipmentCheckoutPreview({tripId: row.trip_id, weight: Number(additionalKg), senderCurrency: row.currency, insurance: false});
  return {...quote, requestId: row.id, packageId: row.package_id, additionalKg: Number(additionalKg), baseWeight: Number(row.package_weight)};
}

export async function previewAdditionalWeight(req, res) {
  try {
    const preview = await buildAdditionalWeightQuote({requestId: req.body?.requestId, senderId: req.user.id || req.user._id, additionalKg: req.body?.additionalKg});
    return res.json({success: true, preview});
  } catch (error) {
    return res.status(error.statusCode || 500).json({success: false, message: error.message});
  }
}
