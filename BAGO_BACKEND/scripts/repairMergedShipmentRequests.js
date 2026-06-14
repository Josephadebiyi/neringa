import dotenv from 'dotenv';

import { query, withTransaction } from '../lib/postgres/db.js';

dotenv.config();

const apply = process.argv.includes('--apply');

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function paymentReference(payment) {
  return String(payment?.requestId || payment?.paymentIntentId || payment?.reference || '').trim();
}

async function main() {
  const candidates = await query(`
    select
      sr.id,
      sr.sender_id,
      sr.traveler_id,
      sr.package_id,
      sr.trip_id,
      sr.amount,
      sr.currency,
      sr.status,
      sr.payment_status,
      sr.payment_info,
      sr.insurance,
      sr.insurance_cost,
      sr.estimated_departure,
      sr.estimated_arrival,
      sr.terms_accepted,
      pkg.package_weight as original_package_weight
    from public.shipment_requests sr
    left join public.packages pkg on pkg.id = sr.package_id
    where jsonb_array_length(coalesce(sr.payment_info -> 'payments', '[]'::jsonb)) > 0
    order by sr.created_at asc
  `);

  const report = [];

  for (const request of candidates.rows) {
    const paymentInfo = request.payment_info || {};
    const payments = Array.isArray(paymentInfo.payments) ? paymentInfo.payments : [];
    const extraPayments = payments.filter((payment) => {
      const ref = paymentReference(payment);
      const packageId = String(payment?.packageId || '').trim();
      return ref && packageId && packageId !== String(request.package_id);
    });

    if (!extraPayments.length) continue;

    const planned = [];
    for (const payment of extraPayments) {
      const ref = paymentReference(payment);
      const packageId = String(payment.packageId).trim();
      const existing = await query(
        `
          select id
          from public.shipment_requests
          where payment_info ->> 'requestId' = $1
             or stripe_payment_intent_id = $1
          limit 1
        `,
        [ref],
      );
      if (existing.rows[0]) continue;

      const packageResult = await query(
        `select id, package_weight from public.packages where id = $1 and user_id = $2 limit 1`,
        [packageId, request.sender_id],
      );
      const packageRow = packageResult.rows[0];
      if (!packageRow) continue;

      planned.push({
        payment,
        reference: ref,
        packageId,
        packageWeight: toNumber(packageRow.package_weight),
        amount: toNumber(payment.amount),
        currency: String(payment.currency || request.currency || 'USD').toUpperCase(),
      });
    }

    if (!planned.length) continue;

    report.push({
      sourceRequestId: request.id,
      splitCount: planned.length,
      newRequests: planned.map((item) => ({
        packageId: item.packageId,
        reference: item.reference,
        amount: item.amount,
        currency: item.currency,
      })),
    });

    if (!apply) continue;

    await withTransaction(async (client) => {
      let amountToSubtract = 0;
      let weightToSubtract = 0;
      for (const item of planned) {
        amountToSubtract += item.amount;
        weightToSubtract += item.packageWeight;

        const paymentInfoForNewRequest = {
          method: item.payment.provider || item.payment.gateway || 'stripe',
          gateway: item.payment.provider || item.payment.gateway || 'stripe',
          status: 'paid',
          requestId: item.reference,
          paymentIntentId: item.reference.startsWith('pi_') ? item.reference : undefined,
          restoredFromMergedRequest: request.id,
        };

        await client.query(
          `
            insert into public.shipment_requests (
              sender_id, traveler_id, package_id, trip_id, amount, currency,
              status, payment_status, payment_info, insurance, insurance_cost,
              estimated_departure, estimated_arrival, terms_accepted,
              stripe_payment_intent_id, created_at, updated_at
            )
            values (
              $1, $2, $3, $4, $5, $6,
              'pending', coalesce($7, 'paid_escrow'), $8, false, 0,
              $9, $10, coalesce($11, true),
              $12, timezone('utc', now()), timezone('utc', now())
            )
          `,
          [
            request.sender_id,
            request.traveler_id,
            item.packageId,
            request.trip_id,
            item.amount,
            item.currency,
            request.payment_status,
            paymentInfoForNewRequest,
            request.estimated_departure,
            request.estimated_arrival,
            request.terms_accepted,
            item.reference.startsWith('pi_') ? item.reference : null,
          ],
        );
      }

      const nextPaymentInfo = {
        ...paymentInfo,
        payments: payments.filter((payment) => !planned.some((item) => item.reference === paymentReference(payment))),
        repairedMergedPaymentsAt: new Date().toISOString(),
      };

      await client.query(
        `
          update public.shipment_requests
          set amount = greatest(0, coalesce(amount, 0) - $2),
              payment_info = $3,
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [request.id, amountToSubtract, nextPaymentInfo],
      );

      if (weightToSubtract > 0) {
        await client.query(
          `
            update public.packages
            set package_weight = greatest(0, coalesce(package_weight, 0) - $2),
                updated_at = timezone('utc', now())
            where id = $1
          `,
          [request.package_id, weightToSubtract],
        );
      }
    });
  }

  console.log(JSON.stringify({
    mode: apply ? 'apply' : 'dry-run',
    repairedSourceRequests: report.length,
    report,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
