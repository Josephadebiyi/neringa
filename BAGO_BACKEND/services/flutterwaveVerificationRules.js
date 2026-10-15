export function verifyRecordedFlutterwavePayment(payment, verified, expected = {}) {
  if (!payment || !verified) return false;
  if (expected.senderId && String(payment.user_id) !== String(expected.senderId)) return false;
  for (const key of ['packageId', 'tripId']) {
    if (expected[key] && payment.raw_response?.[key] !== String(expected[key])) return false;
  }
  return Number.isFinite(Number(verified.amount)) && Number(payment.amount) > 0 &&
    Math.abs(Number(payment.amount) - Number(verified.amount)) <= .011 &&
    String(payment.currency).toUpperCase() === String(verified.currency).toUpperCase();
}
