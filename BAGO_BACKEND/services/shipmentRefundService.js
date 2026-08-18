import { withTransaction } from '../lib/postgres/db.js';
import { refundTransaction } from './flutterwaveService.js';

function normalizePaymentProvider(paymentInfo = {}) {
  return String(paymentInfo.gateway || paymentInfo.method || paymentInfo.provider || '').toLowerCase();
}

function getPaymentReference(paymentInfo = {}) {
  return paymentInfo.requestId || paymentInfo.paymentIntentId || paymentInfo.reference || paymentInfo.transactionReference || null;
}

export async function refundFlutterwavePayment(reference, comments = 'Shipment request refund.') {
  const result = await refundTransaction(reference, { comments });
  if (!result.success) {
    throw new Error(result.message || 'Flutterwave refund failed.');
  }
  return result;
}

export async function reverseTravelerEscrowForRefund(client, requestId, reason) {
  const txResult = await client.query(
    `
      select wt.id, wt.wallet_id, wt.user_id, wt.trip_id, wt.amount, wt.currency
      from public.wallet_transactions wt
      where wt.request_id = $1
        and wt.type = 'escrow_hold'
        and wt.status = 'completed'
      order by wt.created_at desc
    `,
    [requestId],
  );
  for (const escrowTx of txResult.rows) {
    await client.query(
      `
        update public.wallet_accounts
        set escrow_balance = greatest(0, escrow_balance - $2),
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [escrowTx.wallet_id, escrowTx.amount],
    );

    await client.query(
      `
        insert into public.wallet_transactions (wallet_id, user_id, request_id, trip_id, type, amount, currency, status, description, metadata)
        values ($1, $2, $3, $4, 'refund', $5, $6, 'completed', $7, $8)
      `,
      [
        escrowTx.wallet_id,
        escrowTx.user_id,
        requestId,
        escrowTx.trip_id,
        escrowTx.amount,
        escrowTx.currency || 'USD',
        reason,
        { sourceTransactionId: escrowTx.id },
      ],
    );
  }
}

// reason: a short machine-readable tag stored on the refund record, e.g.
// 'traveler_rejected' (traveler self-service) or 'admin_cancelled' (admin-initiated cancel).
export async function refundPaidShipmentRequest(request, { reason = 'traveler_rejected' } = {}) {
  const paymentInfo = request?.paymentInfo || {};
  const provider = normalizePaymentProvider(paymentInfo);
  const reference = getPaymentReference(paymentInfo);
  const previousRefundStatus = paymentInfo.refund?.status;

  if (!reference || provider !== 'flutterwave') {
    return null;
  }
  if (['succeeded', 'pending'].includes(previousRefundStatus)) {
    return paymentInfo.refund || null;
  }

  const refund = await refundFlutterwavePayment(
    reference,
    reason === 'admin_cancelled' ? 'Order cancelled by admin.' : 'Traveler rejected the shipment request.',
  );

  const refundInfo = {
    status: refund.status || 'pending',
    provider,
    reference: refund.id || refund.reference || null,
    paymentReference: reference,
    reason,
    createdAt: new Date().toISOString(),
  };

  await withTransaction(async (client) => {
    await reverseTravelerEscrowForRefund(
      client,
      request.id,
      `Gateway refund (${reason}) for Request ${request.trackingNumber || request.id}`,
    );
    await client.query(
      `
        update public.shipment_requests
        set payment_info = coalesce(payment_info, '{}'::jsonb) || $2::jsonb,
            updated_at = timezone('utc', now())
        where id = $1
      `,
      [request.id, JSON.stringify({ status: 'refunded', refund: refundInfo })],
    );
  });

  return refundInfo;
}
