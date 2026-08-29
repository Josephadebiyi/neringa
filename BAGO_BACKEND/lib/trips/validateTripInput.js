// Shared trip-field validation/parsing, used by both the business self-service
// trip post (AddaTripController.js) and the admin-on-behalf-of-business trip
// creation path (AdminTripController.js) so the two never drift apart.

export const MAX_BULK_TRIP_DATES = 60;

export const normalizeLocation = (value = '') =>
  value.toString().trim().toLowerCase().replace(/\s+/g, ' ');

export const isSameRoute = (fromLocation, fromCountry, toLocation, toCountry) => {
  const fromCity = normalizeLocation(fromLocation);
  const toCity = normalizeLocation(toLocation);
  const fromNation = normalizeLocation(fromCountry);
  const toNation = normalizeLocation(toCountry);

  if (!fromCity || !toCity) return false;
  if (fromCity !== toCity) return false;

  if (fromNation && toNation) {
    return fromNation === toNation;
  }

  return true;
};

// Returns { error: { status, body } } on failure, or
// { dates, parsedDates, price, weight } on success. Callers decide how to
// respond to `error` (status/body are ready to hand straight to res.status().json()).
export function validateTripInput({
  fromLocation, fromCountry, toLocation, toCountry,
  departureDate, departureDates, arrivalDate,
  availableKg, travelMeans, pricePerKg, currency,
  allowMultipleDates = true,
}) {
  const dates = Array.isArray(departureDates) && departureDates.length
    ? departureDates
    : (departureDate ? [departureDate] : []);

  if (!dates.length) {
    return { error: { status: 400, body: { message: 'At least one departure date is required' } } };
  }
  if (dates.length > 1 && !allowMultipleDates) {
    return {
      error: {
        status: 403,
        body: {
          message: 'Posting a trip across multiple dates at once is available to business accounts only.',
          errorType: 'BUSINESS_ACCOUNT_REQUIRED',
        },
      },
    };
  }
  if (dates.length > MAX_BULK_TRIP_DATES) {
    return { error: { status: 400, body: { message: `You can post at most ${MAX_BULK_TRIP_DATES} dates at once` } } };
  }

  if (!fromLocation || !toLocation || !availableKg || !travelMeans || !pricePerKg || !currency) {
    return { error: { status: 400, body: { message: 'All fields are required, including price and currency' } } };
  }

  if (isSameRoute(fromLocation, fromCountry, toLocation, toCountry)) {
    return { error: { status: 400, body: { message: 'Departure and destination must be different cities.' } } };
  }

  const parsedDates = [];
  for (const rawDate of dates) {
    const departureAt = new Date(rawDate);
    if (Number.isNaN(departureAt.getTime())) {
      return { error: { status: 400, body: { message: 'Invalid departure date' } } };
    }
    // A single explicit arrivalDate only applies when posting one date at a time —
    // across a bulk multi-date post each date's own arrival defaults to itself.
    const arrivalAt = (dates.length === 1 && arrivalDate) ? new Date(arrivalDate) : new Date(departureAt);
    if (Number.isNaN(arrivalAt.getTime())) {
      return { error: { status: 400, body: { message: 'Invalid arrival date' } } };
    }
    parsedDates.push({ departureAt, arrivalAt });
  }

  const price = parseFloat(pricePerKg);
  const weight = parseFloat(availableKg);

  if (!Number.isFinite(weight) || weight <= 0) {
    return { error: { status: 400, body: { message: 'Trip capacity must be greater than 0kg' } } };
  }
  if (!Number.isFinite(price) || price <= 0) {
    return { error: { status: 400, body: { message: 'Price per kg must be a positive number' } } };
  }

  return { dates, parsedDates, price, weight };
}
