import cron from "node-cron";
import { query as pgQuery } from "../lib/postgres/db.js";
import { getShipmentRequestById } from "../lib/postgres/shipping.js";
import { purchaseMyCoverPolicy } from "../services/myCoverService.js";

// Retries MyCover purchases that MyCover rejected (insurance_status 'failed'),
// for shipments that have not been delivered yet. Capped per shipment so a
// payload MyCover keeps rejecting is not resent forever. Shipments missing
// sender details wait for the sender to add them instead.
export const MAX_INSURANCE_ATTEMPTS = 5;
const RETRYABLE_STATUSES = [
  'accepted', 'accepted_awaiting_inspection', 'inspection_in_progress', 'inspection_completed',
  'approved_for_trip', 'package_received', 'delivery_started', 'intransit', 'arrived_at_hub',
];

export async function retryFailedInsurancePurchases() {
  const { rows } = await pgQuery(
    `SELECT id FROM public.shipment_requests
     WHERE insurance = true AND insurance_cost > 0
       AND insurance_status = 'failed'
       AND NULLIF(insurance_policy_id, '') IS NULL
       AND status = ANY($1)
       AND COALESCE((insurance_policy_data->>'attempts')::int, 0) < $2
       AND COALESCE(insurance_error, '') NOT LIKE 'MyCover required sender fields are missing%'
       AND COALESCE(insurance_error, '') <> 'MYCOVER_SECRET_KEY is not configured'
     ORDER BY updated_at ASC
     LIMIT 20`,
    [RETRYABLE_STATUSES, MAX_INSURANCE_ATTEMPTS],
  );
  let activated = 0;
  for (const { id } of rows) {
    try {
      const request = await getShipmentRequestById(id);
      if (request && await purchaseMyCoverPolicy(request)) activated += 1;
    } catch (error) {
      console.error(`Insurance retry failed for ${id}:`, error.message);
    }
  }
  return { checked: rows.length, activated };
}

export const startInsuranceRetry = () => {
  cron.schedule("*/30 * * * *", async () => {
    try {
      const summary = await retryFailedInsurancePurchases();
      if (summary.checked) console.log("🛡️ Insurance retry:", summary);
    } catch (error) {
      console.error("❌ Insurance retry job failed:", error.message);
    }
  });
};
