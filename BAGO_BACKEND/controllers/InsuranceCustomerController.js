import { query } from '../lib/postgres/db.js';
import { getShipmentRequestById } from '../lib/postgres/shipping.js';
import { isInsuranceSubmissionInFlight, purchaseMyCoverPolicy } from '../services/myCoverService.js';

export async function completeInsuranceDetails(req, res) {
  let stage = 'load_shipment';
  let detailsSaved = false;
  try {
    const request = await getShipmentRequestById(req.params.requestId);
    if (!request) return res.status(404).json({success: false, message: 'Shipment not found.'});
    const userId = req.user.id || req.user._id;
    if (request.senderId !== userId) return res.status(403).json({success: false, message: 'Only the sender can provide their insurance details.'});
    if (!request.insurance || Number(request.insuranceCost) <= 0) return res.status(409).json({success: false, message: 'Insurance was not selected for this shipment.'});
    if (request.insurancePolicyId) return res.json({success: true, data: request});
    if (['pending', 'completed', 'cancelled', 'rejected', 'rejected_at_inspection_under_review'].includes(request.status)) return res.status(409).json({success: false, message: 'Insurance activation is available after shipment acceptance.'});
    if (isInsuranceSubmissionInFlight(request.insuranceStatus, request.insurancePolicyData)) return res.status(409).json({success: false, message: 'Insurance has already been submitted. Await provider confirmation.'});
    if (req.body?.gender !== undefined) {
      const value = String(req.body.gender).trim().toLowerCase();
      if (!['male', 'female'].includes(value)) return res.status(400).json({success: false, message: 'Select a valid gender for the insurance application.'});
      stage = 'save_customer_details';
      const updated = await query(`update public.shipment_requests
        set insurance_policy_data = coalesce(insurance_policy_data, '{}'::jsonb) || jsonb_build_object('customerDetails', jsonb_build_object('gender', $3::text)),
            updated_at = timezone('utc', now())
        where id = $1 and sender_id = $2 and nullif(insurance_policy_id, '') is null
          and (insurance_policy_data->>'submittedAt' is null or insurance_status = 'failed') returning id`, [request.id, userId, value === 'male' ? 'Male' : 'Female']);
      if (!updated.rows.length) return res.status(409).json({success: false, message: 'Insurance is already being activated. Refresh the shipment.'});
      detailsSaved = true;
    }
    stage = 'reload_customer_details';
    const refreshed = await getShipmentRequestById(request.id);
    stage = 'activate_policy';
    await purchaseMyCoverPolicy(refreshed);
    stage = 'refresh_policy_status';
    return res.json({success: true, data: await getShipmentRequestById(request.id)});
  } catch (error) {
    console.error('Insurance customer details failed:', {
      requestId: req.params.requestId, stage, detailsSaved,
      code: error.code || null, message: error.message,
    });
    if (error.code === 'INSURANCE_CUSTOMER_DETAILS_REQUIRED') {
      return res.status(422).json({success: false, code: error.code, missingFields: error.missingFields, detailsSaved, message: error.message});
    }
    return res.status(502).json({success: false,
      code: detailsSaved ? 'INSURANCE_ACTIVATION_FAILED' : 'INSURANCE_DETAILS_SAVE_FAILED',
      detailsSaved,
    });
  }
}
