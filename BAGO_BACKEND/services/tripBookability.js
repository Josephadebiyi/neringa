import { query } from '../lib/postgres/db.js';
import { buildTripCapacitySnapshot, isTripPubliclyVisible } from '../lib/postgres/tripCapacity.js';

// The same rules booking creation enforces, checked before the customer is
// charged, so nobody pays for a trip that can no longer take their package.
// Returns null when bookable, or {status, body} to send back.
export async function tripBookingProblem({ tripId, travelerId, packageWeight }) {
  const snapshot = await buildTripCapacitySnapshot({ query }, tripId);
  if (!snapshot || (travelerId && snapshot.userId !== travelerId)) {
    return { status: 404, body: { success: false, code: 'TRIP_NOT_FOUND', message: 'This trip could not be found. Please choose another trip.' } };
  }
  if (!isTripPubliclyVisible(snapshot)) {
    return { status: 409, body: { success: false, code: 'TRIP_NOT_BOOKABLE', message: 'This trip is no longer available for booking. Please choose another trip.' } };
  }
  if (Number(packageWeight) > Number(snapshot.availableKg)) {
    return { status: 409, body: { success: false, code: 'TRIP_FULL', message: `This trip only has ${snapshot.availableKg}kg left. Please choose another trip or reduce the weight.` } };
  }
  return null;
}
