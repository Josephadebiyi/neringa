import { verifyStripeBookingIntent } from './stripeCheckoutRules.js';

// Called only after Stripe's webhook signature has been verified. The normal
// booking controller re-verifies the payment and serializes app/webhook retries.
export async function completeStripeBooking(intent, requestPackage) {
  const metadata = intent.metadata || {};
  if (!metadata.packageId || !metadata.tripId || !metadata.travelerId || !metadata.senderId) return;
  const verification = verifyStripeBookingIntent(intent, {senderId: metadata.senderId,
    packageId: metadata.packageId, tripId: metadata.tripId, travelerId: metadata.travelerId});
  if (!verification.success) throw new Error(verification.message);
  const quote = verification.data.quote;
  let code = 200;
  let result;
  const response = {
    status(value) { code = value; return this; },
    json(value) { result = value; return this; },
  };
  await requestPackage({user: {id: metadata.senderId}, app: {get: () => null}, body: {
    packageId: metadata.packageId, tripId: metadata.tripId, travelerId: metadata.travelerId,
    amount: quote.totalAmount, currency: quote.senderCurrency,
    insurance: quote.insuranceAmount > 0, insuranceCost: quote.insuranceAmount,
    termsAccepted: true, paymentProvider: 'stripe', paymentReference: intent.id,
  }}, response);
  if (code >= 400 || result?.success !== true || result?.paymentPending === true) {
    throw new Error('Paid shipment finalization needs another attempt.');
  }
  return result;
}
