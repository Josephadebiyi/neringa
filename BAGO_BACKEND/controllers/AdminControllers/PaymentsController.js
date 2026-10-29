import { query, queryOne } from '../../lib/postgres/db.js';
import { markPaymentVerified } from '../../lib/postgres/flutterwavePayments.js';
import { verifyTransactionByReference } from '../../services/flutterwaveService.js';
import { completeStripeBooking } from '../../services/stripeBookingCompletion.js';
import { recoverFlutterwavePayment } from '../../services/paidBookingRecovery.js';
import { RequestPackage } from '../postgresRequestController.js';
import { retrieveStripePaymentIntent } from '../StripeController.js';

// Statuses meaning the customer's money was taken.
const PAID_STATUSES = ['succeeded', 'verified', 'paid_escrow', 'processing'];

function serializePayment(row) {
  const raw = row.raw_response || {};
  const metadata = raw.paymentIntent?.metadata || {};
  const paid = PAID_STATUSES.includes(String(row.status || '').toLowerCase());
  return {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    provider: row.provider,
    paymentMethod: row.payment_method || metadata.paymentMethodType || raw.payment_type || null,
    status: row.status,
    amount: Number(row.amount),
    currency: row.currency,
    // Stripe: the PaymentIntent id. Flutterwave: Bago's tx_ref, plus the
    // numeric transaction id once Flutterwave has confirmed the charge.
    reference: row.stripe_payment_intent_id || row.provider_reference,
    providerTransactionId: raw.id ? String(raw.id) : null,
    customer: { id: row.user_id, name: [row.first_name, row.last_name].filter(Boolean).join(' ') || null, email: row.email },
    shipmentId: row.shipment_id,
    packageId: raw.packageId || metadata.packageId || null,
    tripId: raw.tripId || metadata.tripId || null,
    needsAttention: paid && !row.shipment_id,
    alertedAt: raw.recoveryAlertedAt || null,
    lastRetry: raw.adminRetry || null,
  };
}

// GET /payments?filter=attention|paid|failed|all&provider=&search=&page=&limit=
export async function listPayments(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
    const where = [];
    const params = [];
    const filter = String(req.query.filter || 'all');
    if (filter === 'attention') {
      params.push(PAID_STATUSES);
      where.push(`p.status = any($${params.length}) and p.shipment_id is null`);
    } else if (filter === 'paid') {
      params.push(PAID_STATUSES);
      where.push(`p.status = any($${params.length})`);
    } else if (filter === 'failed') {
      params.push(PAID_STATUSES);
      where.push(`not (p.status = any($${params.length}))`);
    }
    if (['stripe', 'flutterwave'].includes(req.query.provider)) {
      params.push(req.query.provider);
      where.push(`p.provider = $${params.length}`);
    }
    const search = String(req.query.search || '').trim();
    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      where.push(`(lower(coalesce(pr.email, '')) like $${params.length}
        or lower(coalesce(p.stripe_payment_intent_id, p.provider_reference, '')) like $${params.length}
        or lower(coalesce(p.raw_response ->> 'id', '')) like $${params.length})`);
    }
    const whereSql = where.length ? `where ${where.join(' and ')}` : '';
    params.push(limit, (page - 1) * limit);
    const rows = await query(
      `select p.id, p.created_at, p.updated_at, p.provider, p.payment_method, p.status, p.amount, p.currency,
              p.stripe_payment_intent_id, p.provider_reference, p.shipment_id, p.user_id, p.raw_response,
              pr.first_name, pr.last_name, pr.email
       from public.payments p
       left join public.profiles pr on pr.id = p.user_id
       ${whereSql}
       order by p.created_at desc
       limit $${params.length - 1} offset $${params.length}`,
      params,
    );
    const attention = await queryOne(
      `select count(*)::int as count from public.payments where status = any($1) and shipment_id is null`,
      [PAID_STATUSES],
    );
    return res.json({ success: true, data: rows.rows.map(serializePayment), page, limit, needsAttention: attention?.count || 0 });
  } catch (error) {
    next(error);
  }
}

// POST /payments/:id/retry-booking — re-checks the payment with its provider
// and creates the booking if it's paid and has none (what re-sending the
// provider's webhook would do).
export async function retryPaymentBooking(req, res, next) {
  try {
    const payment = await queryOne(
      `select id, user_id, provider, status, amount, currency, stripe_payment_intent_id, provider_reference, shipment_id, raw_response
       from public.payments where id = $1`,
      [req.params.id],
    );
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.shipment_id) {
      return res.json({ success: true, status: 'exists', shipmentId: payment.shipment_id, message: 'This payment already has a booking.' });
    }

    let outcome;
    if (payment.provider === 'stripe') {
      const intent = await retrieveStripePaymentIntent(payment.stripe_payment_intent_id);
      if (!intent) return res.status(409).json({ success: false, message: 'Stripe is not configured, or this is not a Stripe payment intent.' });
      if (intent.status !== 'succeeded') {
        return res.status(409).json({ success: false, message: `Stripe reports this payment as "${intent.status}", so there is nothing to book.` });
      }
      await completeStripeBooking(intent, RequestPackage);
      outcome = { status: 'created' };
    } else if (payment.provider === 'flutterwave') {
      let current = payment;
      if (!payment.raw_response?.id) {
        const verified = await verifyTransactionByReference(payment.provider_reference);
        if (!verified.success) {
          return res.status(409).json({ success: false, message: `Flutterwave has no successful charge for this payment: ${verified.message}` });
        }
        await markPaymentVerified({ provider: 'flutterwave', providerReference: payment.provider_reference, status: 'verified', rawResponse: verified.data });
        current = { ...payment, status: 'verified', raw_response: { ...payment.raw_response, ...verified.data } };
      }
      outcome = await recoverFlutterwavePayment(current);
    } else {
      return res.status(400).json({ success: false, message: `Unsupported provider: ${payment.provider}` });
    }

    await query(
      `update public.payments set raw_response = coalesce(raw_response, '{}'::jsonb) || $2::jsonb where id = $1`,
      [payment.id, { adminRetry: { adminId: req.admin?.id || null, at: new Date().toISOString(), outcome: outcome.status } }],
    );
    const linked = await queryOne('select shipment_id from public.payments where id = $1', [payment.id]);
    if (outcome.status === 'created' || outcome.status === 'exists' || linked?.shipment_id) {
      return res.json({ success: true, status: outcome.status, shipmentId: linked?.shipment_id || outcome.requestId || null,
        message: 'Booking created. The customer and traveler have been notified.' });
    }
    return res.status(422).json({ success: false, status: outcome.status,
      message: outcome.result?.message || outcome.error || 'The booking could not be created. Check the server logs.' });
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: `Retry failed: ${error.message}` });
    }
    return next(error);
  }
}
