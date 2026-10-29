import { query, queryOne } from '../lib/postgres/db.js';
import { markPaymentVerified } from '../lib/postgres/flutterwavePayments.js';
import { verifyTransactionByReference } from './flutterwaveService.js';
import { completeStripeBooking } from './stripeBookingCompletion.js';
import { finalizePaidBooking, RequestPackage } from '../controllers/postgresRequestController.js';
import { retrieveStripePaymentIntent } from '../controllers/StripeController.js';
import { listActiveAdminEmails } from '../lib/postgres/trips.js';
import { sendPaidBookingFailedAdminAlert } from './emailNotifications.js';

// Payments younger than this are left to the app, which normally finishes the
// booking seconds after paying.
const GRACE_MINUTES = 5;
const LOOKBACK_DAYS = 3;
const BATCH = 20;

// Creates the booking for a verified Flutterwave payment that has none.
export async function recoverFlutterwavePayment(payment) {
  const raw = payment?.raw_response || {};
  const transactionId = raw.id;
  if (!transactionId || !raw.packageId || !raw.tripId || !payment.user_id) return { status: 'skipped' };
  const trip = await queryOne('select user_id from public.trips where id = $1', [raw.tripId]);
  if (!trip?.user_id) return { status: 'skipped' };
  const insuranceAmount = Number(raw.authoritativePreview?.insuranceAmount || 0);
  const outcome = await finalizePaidBooking(payment.user_id, {
    packageId: raw.packageId,
    tripId: raw.tripId,
    travelerId: trip.user_id,
    amount: Number(payment.amount),
    currency: String(payment.currency || '').toUpperCase(),
    ...(raw.requestId && { requestId: raw.requestId, additionalKg: Number(raw.additionalKg || 0) }),
    insurance: insuranceAmount > 0,
    insuranceCost: insuranceAmount,
    paymentProvider: 'flutterwave',
    paymentReference: String(transactionId),
  });
  // Bookings made before payments were linked by transaction id still have an
  // unlinked payment row; link it so it stops looking unbooked.
  if (outcome.status === 'exists' && outcome.requestId && payment.id) {
    await query(
      `update public.payments set shipment_id = $2, status = 'paid_escrow', updated_at = timezone('utc', now())
       where id = $1 and shipment_id is null`,
      [payment.id, outcome.requestId],
    ).catch((error) => console.warn('Could not link payment to existing booking:', error.message));
  }
  return outcome;
}

// Called from the Flutterwave webhook once a charge is verified.
export async function recoverFlutterwavePaymentByReference(txRef) {
  const payment = await queryOne(
    `select id, user_id, amount, currency, status, raw_response, shipment_id from public.payments
     where provider = 'flutterwave' and provider_reference = $1`,
    [txRef],
  );
  if (!payment || payment.shipment_id) return { status: 'exists' };
  return recoverFlutterwavePayment(payment);
}

async function recoverFlutterwave(summary) {
  // Payments whose webhook and redirect both never arrived: ask Flutterwave.
  const unconfirmed = await query(
    `select provider_reference from public.payments
     where provider = 'flutterwave' and status = 'initiated' and shipment_id is null
       and created_at < timezone('utc', now()) - ($1::int * interval '1 minute')
       and created_at > timezone('utc', now()) - ($2::int * interval '1 day')
     order by created_at desc limit $3`,
    [GRACE_MINUTES, LOOKBACK_DAYS, BATCH],
  );
  for (const { provider_reference: txRef } of unconfirmed.rows) {
    const verified = await verifyTransactionByReference(txRef);
    if (!verified.success) continue;
    await markPaymentVerified({ provider: 'flutterwave', providerReference: txRef, status: 'verified', rawResponse: verified.data });
    summary.confirmed += 1;
  }

  const unbooked = await query(
    `select id, user_id, amount, currency, raw_response from public.payments
     where provider = 'flutterwave' and status = 'verified' and shipment_id is null
       and raw_response ->> 'packageId' is not null
       and created_at < timezone('utc', now()) - ($1::int * interval '1 minute')
       and created_at > timezone('utc', now()) - ($2::int * interval '1 day')
     order by created_at asc limit $3`,
    [GRACE_MINUTES, LOOKBACK_DAYS, BATCH],
  );
  for (const payment of unbooked.rows) {
    const outcome = await recoverFlutterwavePayment(payment).catch((error) => ({ status: 'failed', error: error.message }));
    tally(summary, outcome, `flutterwave ${payment.id}`, payment.id);
  }
}

async function recoverStripe(summary) {
  const unbooked = await query(
    `select id, stripe_payment_intent_id from public.payments
     where provider = 'stripe' and stripe_payment_intent_id is not null and shipment_id is null
       and status not in ('failed', 'canceled', 'cancelled', 'refunded')
       and raw_response -> 'paymentIntent' -> 'metadata' ->> 'bago_quote' is not null
       and created_at < timezone('utc', now()) - ($1::int * interval '1 minute')
       and created_at > timezone('utc', now()) - ($2::int * interval '1 day')
     order by created_at asc limit $3`,
    [GRACE_MINUTES, LOOKBACK_DAYS, BATCH],
  );
  for (const payment of unbooked.rows) {
    try {
      const intent = await retrieveStripePaymentIntent(payment.stripe_payment_intent_id);
      if (intent?.status !== 'succeeded') continue;
      await completeStripeBooking(intent, RequestPackage);
      tally(summary, { status: 'created' }, `stripe ${payment.id}`);
    } catch (error) {
      tally(summary, { status: 'failed', error: error.message }, `stripe ${payment.id}`, payment.id);
    }
  }
}

function tally(summary, outcome, label, paymentId) {
  if (outcome.status === 'created') summary.created += 1;
  else if (outcome.status === 'failed') {
    summary.failed += 1;
    const reason = outcome.error || outcome.result?.reason || outcome.result?.message || `Booking returned ${outcome.code}`;
    console.error(`Paid booking recovery failed for ${label}:`, reason);
    if (paymentId) alertAdminsOnce(paymentId, reason).catch((error) => console.error('Paid booking alert failed:', error.message));
  }
}

// Emails every admin the first time a paid payment can't be booked, so a
// customer is never left paid-but-unbooked without anyone knowing.
async function alertAdminsOnce(paymentId, reason) {
  const claimed = await queryOne(
    `update public.payments
     set raw_response = coalesce(raw_response, '{}'::jsonb) || jsonb_build_object('recoveryAlertedAt', timezone('utc', now()))
     where id = $1 and coalesce(raw_response ->> 'recoveryAlertedAt', '') = ''
     returning provider, amount, currency, coalesce(stripe_payment_intent_id, provider_reference) as reference,
       (select email from public.profiles where id = payments.user_id) as user_email`,
    [paymentId],
  );
  if (!claimed) return;
  const adminEmails = await listActiveAdminEmails();
  await Promise.all(adminEmails.map((adminEmail) => sendPaidBookingFailedAdminAlert(adminEmail, {
    userEmail: claimed.user_email || 'unknown', amount: claimed.amount, currency: claimed.currency,
    provider: claimed.provider, reference: claimed.reference, reason: String(reason).slice(0, 300),
  })));
}

export async function recoverPaidBookings() {
  const summary = { confirmed: 0, created: 0, failed: 0 };
  await recoverFlutterwave(summary).catch((error) => console.error('Flutterwave booking recovery failed:', error.message));
  await recoverStripe(summary).catch((error) => console.error('Stripe booking recovery failed:', error.message));
  return summary;
}
