import Stripe from 'stripe';
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

export async function reverseTravelerEscrowForRefund(client, requestId, reason, ratio = 1) {
  // Fast Payout can move this shipment's held funds out of escrow_balance and
  // into the traveler's available_balance *before* delivery completes (see
  // cron/fastPayoutCron.js). If that already happened, the money is no longer
  // sitting in escrow_balance to claw back — it must be clawed back from
  // available_balance instead, even if that drives the balance negative,
  // otherwise a fast-payout business can get paid and then reject/cancel the
  // shipment (or have it admin-cancelled) to make the sender's refund "free".
  const requestRow = await client.query(
    `select fast_payout_released_at from public.shipment_requests where id = $1`,
    [requestId],
  );
  const fastPayoutReleased = Boolean(requestRow.rows[0]?.fast_payout_released_at);

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
    const refundAmount = Math.round(Number(escrowTx.amount) * Math.min(1, Math.max(0, ratio)) * 100) / 100;
    if (fastPayoutReleased) {
      await client.query(
        `
          update public.wallet_accounts
          set available_balance = available_balance - $2,
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [escrowTx.wallet_id, refundAmount],
      );
    } else {
      await client.query(
        `
          update public.wallet_accounts
          set escrow_balance = greatest(0, escrow_balance - $2),
              updated_at = timezone('utc', now())
          where id = $1
        `,
        [escrowTx.wallet_id, refundAmount],
      );
    }

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
        refundAmount,
        escrowTx.currency || 'USD',
        reason,
        { sourceTransactionId: escrowTx.id, clawedBackFromAvailableBalance: fastPayoutReleased },
      ],
    );
  }
}

let ledgerReady;
async function ensureRefundLedger() {
  ledgerReady ||= withTransaction(async client => {
    await client.query("select pg_advisory_xact_lock(hashtextextended('bago-refund-ledger-schema', 0))");
    await client.query(`create table if not exists public.shipment_refund_attempts (
      provider text not null,
      payment_reference text not null,
      request_id uuid not null,
      refund_info jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (provider, payment_reference)
    )`);
    await client.query('alter table public.shipment_refund_attempts enable row level security');
  }).catch(error => { ledgerReady = null; throw error; });
  return ledgerReady;
}

// Reserve durably before making a processor call. Never retry an ambiguous
// attempt: a network error can happen after the processor accepted the refund.
function refundError(message, statusCode = 502) {
  return Object.assign(new Error(message), { statusCode, code: 'REFUND_RECONCILIATION_REQUIRED' });
}

async function saveRefund(client, id, refund, extra = {}) {
  await client.query(
    `update public.shipment_requests
     set payment_info = coalesce(payment_info, '{}'::jsonb) || $2::jsonb,
         updated_at = timezone('utc', now()) where id = $1`,
    [id, JSON.stringify({ ...extra, refund })],
  );
  if (refund.provider && refund.paymentReference) {
    await client.query(`update public.shipment_refund_attempts set refund_info = $3::jsonb, updated_at = now()
      where provider = $1 and payment_reference = $2`,
    [refund.provider, String(refund.paymentReference), JSON.stringify(refund)]);
  }
}

export async function refundPaidShipmentRequest(request, {
  reason = 'traveler_rejected', partialAmount = null,
} = {}) {
  await ensureRefundLedger();
  const reservation = await withTransaction(async client => {
    const { rows } = await client.query(
      'select * from public.shipment_requests where id = $1 for update', [request.id]);
    const row = rows[0];
    if (!row) throw refundError('Shipment not found.', 404);
    const info = row.payment_info || {};
    const previous = info.refund;
    if (previous) {
      if (['succeeded', 'pending'].includes(previous.status)) return { existing: previous };
      throw refundError('A refund is already being checked. Contact support; do not initiate another refund.', 409);
    }
    // Older refund endpoints used these fields instead of the shared marker.
    if (row.stripe_refund_id || info.refundId || ['refunded', 'cancelled'].includes(info.status) || row.payment_status === 'refunded') {
      return { existing: { status: 'succeeded', reference: row.stripe_refund_id || info.refundId || null,
        provider: normalizePaymentProvider(info) || 'stripe', legacy: true } };
    }
    const provider = normalizePaymentProvider(info) || (row.stripe_payment_intent_id ? 'stripe' : '');
    const reference = provider === 'stripe'
      ? row.stripe_payment_intent_id || getPaymentReference(info) : getPaymentReference(info);
    if (!reference && !provider && !['paid', 'paid_escrow', 'captured', 'released', 'processing_escrow'].includes(row.payment_status || info.status)) return { unpaid: true };
    if (!['stripe', 'flutterwave'].includes(provider) || !reference) {
      throw refundError('The original payment could not be identified. Contact support to reconcile the refund.');
    }
    if (provider === 'flutterwave' && !/^\d+$/.test(String(reference))) {
      throw refundError('The original Flutterwave transaction ID needs reconciliation.');
    }
    await client.query('select pg_advisory_xact_lock(hashtextextended($1, 0))', [`refund:${provider}:${reference}`]);
    const attempt = await client.query(
      'select request_id, refund_info from public.shipment_refund_attempts where provider = $1 and payment_reference = $2 for update',
      [provider, String(reference)]);
    if (attempt.rows[0]) {
      const prior = attempt.rows[0];
      if (String(prior.request_id) === String(row.id) && ['succeeded', 'pending'].includes(prior.refund_info.status)) return { existing: prior.refund_info };
      throw refundError('A refund for this payment already exists or needs reconciliation. Do not initiate another refund.', 409);
    }
    const duplicate = await client.query(
      `select id from public.shipment_requests where id <> $1
       and payment_info->'refund'->>'provider' = $2
       and payment_info->'refund'->>'paymentReference' = $3 limit 1`,
      [row.id, provider, String(reference)]);
    if (duplicate.rows.length) throw refundError('A refund for this payment already exists. Contact support.', 409);
    const refund = { status: 'initiating' , provider, paymentReference: reference, reason,
      partialAmount, createdAt: new Date().toISOString() };
    await client.query(
      'insert into public.shipment_refund_attempts (provider, payment_reference, request_id, refund_info) values ($1, $2, $3, $4::jsonb)',
      [provider, String(reference), row.id, JSON.stringify(refund)]);
    await saveRefund(client, row.id, refund);
    return { row, refund };
  });
  if (reservation.unpaid) return null;
  if (reservation.existing) return reservation.existing;
  const { row, refund } = reservation;
  let result;
  try {
    if (refund.provider === 'stripe') {
      if (!process.env.STRIPE_SECRET_KEY) throw refundError('Stripe refunds are not configured.');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());
      const intent = await stripe.paymentIntents.retrieve(refund.paymentReference, { expand: ['latest_charge'] });
      if (intent.metadata?.senderId && intent.metadata.senderId !== row.sender_id) throw refundError('Payment ownership needs reconciliation.');
      // Never stack a second refund on an existing full or partial refund.
      if (intent.latest_charge?.amount_refunded > 0) throw refundError('This payment already has a refund. Contact support to reconcile its status.');
      if (intent.status === 'requires_capture' || ['requires_payment_method', 'requires_confirmation', 'requires_action'].includes(intent.status)) {
        await stripe.paymentIntents.cancel(intent.id, {}, { idempotencyKey: `bago-refund-cancel-${row.id}` });
        result = { status: 'succeeded', reference: intent.id, authorizationReleased: true };
      } else if (intent.status === 'canceled') {
        result = { status: 'succeeded', reference: intent.id, authorizationReleased: true };
      } else if (intent.status === 'succeeded') {
        if (partialAmount !== null && (!Number.isInteger(partialAmount) || partialAmount <= 0 || partialAmount > intent.amount_received)) throw refundError('Invalid refund amount.', 400);
        const response = await stripe.refunds.create({ payment_intent: intent.id,
          ...(partialAmount !== null && { amount: partialAmount }), reason: 'requested_by_customer',
          metadata: { shipmentId: row.id, refundReason: reason },
        }, { idempotencyKey: `bago-shipment-refund-${row.id}` });
        if (!['succeeded', 'pending', 'requires_action'].includes(response.status)) throw refundError('The processor did not accept the refund. Contact support.');
        result = { status: response.status === 'succeeded' ? 'succeeded' : 'pending', reference: response.id, amount: response.amount };
        // Retain reversal of legacy Stripe Connect payouts; use the same durable
        // reservation and a separate processor idempotency key.
        if (row.stripe_transfer_id && Number(row.traveler_payout_amount) > 0) {
          const ratio = partialAmount === null ? 1 : partialAmount / intent.amount_received;
          await stripe.transfers.createReversal(row.stripe_transfer_id, {
            amount: Math.round(Number(row.traveler_payout_amount) * ratio), metadata: { shipmentId: row.id, reason },
          }, { idempotencyKey: `bago-shipment-refund-reversal-${row.id}` });
        }
      } else throw refundError('Payment is still processing. Support must reconcile it before issuing a refund.');
    } else {
      if (partialAmount !== null) throw refundError('Partial refunds require support review.', 400);
      const response = await refundFlutterwavePayment(refund.paymentReference,
        reason.startsWith('admin_') ? 'Shipment rejected or cancelled by admin.' : 'Shipment request cancelled or rejected.');
      const status = String(response.status || '').toLowerCase();
      if (!['succeeded', 'completed', 'successful', 'pending', 'processing', 'new'].includes(status)) throw refundError('Flutterwave refund needs reconciliation.');
      result = { status: ['succeeded', 'completed', 'successful'].includes(status) ? 'succeeded' : 'pending', reference: response.id || response.reference };
    }
    const final = { ...refund, ...result };
    await withTransaction(async client => {
      await client.query('select id from public.shipment_requests where id = $1 for update', [row.id]);
      const ratio = partialAmount === null ? 1 : partialAmount / Math.round(Number(row.amount) * 100);
      await reverseTravelerEscrowForRefund(client, row.id,
        `Gateway refund (${reason}) for Request ${row.tracking_number || row.id}`, ratio);
      await saveRefund(client, row.id, final, { status: final.status === 'succeeded' ? 'refunded' : 'refund_pending' });
      await client.query(`update public.shipment_requests set payment_status = $2,
        stripe_refund_id = coalesce($3, stripe_refund_id), refund_reason = $4,
        refund_amount = coalesce($5, refund_amount),
        refunded_at = case when $2 = 'refunded' then now() else refunded_at end where id = $1`,
      [row.id, final.status === 'succeeded' ? 'refunded' : 'refund_pending', refund.provider === 'stripe' && !result.authorizationReleased ? result.reference : null, reason, result.amount ?? null]);
    });
    return final;
  } catch (error) {
    // Preserve the reservation even after a crash, timeout, or failed DB commit.
    // No endpoint may automatically send another refund for this shipment.
    await withTransaction(async client => {
      await client.query('select id from public.shipment_requests where id = $1 for update', [row.id]);
      await saveRefund(client, row.id, { ...refund, ...(result || {}), status: 'reconciliation_required' });
    }).catch(() => {});
    throw refundError('The refund needs reconciliation. Contact support before retrying; no duplicate refund will be initiated.');
  }
}
