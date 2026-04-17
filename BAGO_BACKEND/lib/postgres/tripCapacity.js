import { query } from './db.js';

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

export function isTripPubliclyVisible(snapshot) {
  if (!snapshot) return false;
  const status = (snapshot.status || '').toLowerCase();
  const kycStatus = (snapshot.kycStatus || '').toLowerCase();
  const departureDate = new Date(snapshot.departureDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    ['active', 'verified'].includes(status) &&
    snapshot.availableKg > 0 &&
    !Number.isNaN(departureDate.getTime()) &&
    departureDate >= today &&
    ['approved', 'verified', 'completed'].includes(kycStatus)
  );
}

export async function ensureTripCapacityColumns(executor = { query }) {
  await executor.query(`
    ALTER TABLE public.trips
      ADD COLUMN IF NOT EXISTS total_kg NUMERIC NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sold_kg NUMERIC NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS reserved_kg NUMERIC NOT NULL DEFAULT 0
  `);
}

export async function buildTripCapacitySnapshot(executor, tripId, { lockTrip = false } = {}) {
  await ensureTripCapacityColumns(executor);

  const tripResult = await executor.query(
    `
      SELECT
        t.id,
        t.user_id,
        t.status,
        t.departure_date,
        t.arrival_date,
        t.price_per_kg,
        t.currency,
        COALESCE(NULLIF(t.total_kg, 0), GREATEST(COALESCE(t.available_kg, 0) + COALESCE(t.sold_kg, 0) + COALESCE(t.reserved_kg, 0), COALESCE(t.available_kg, 0))) AS total_kg,
        p.kyc_status
      FROM public.trips t
      LEFT JOIN public.profiles p ON p.id = t.user_id
      WHERE t.id = $1
      ${lockTrip ? 'FOR UPDATE' : ''}
    `,
    [tripId],
  );

  const trip = tripResult.rows[0];
  if (!trip) return null;

  const aggregateResult = await executor.query(
    `
      SELECT
        COALESCE(SUM(CASE WHEN sr.status = 'pending' THEN COALESCE(pkg.package_weight, 0) ELSE 0 END), 0) AS reserved_kg,
        COALESCE(SUM(CASE WHEN sr.status IN ('accepted', 'intransit', 'delivering', 'completed') THEN COALESCE(pkg.package_weight, 0) ELSE 0 END), 0) AS sold_kg,
        COUNT(*) FILTER (WHERE sr.status NOT IN ('rejected', 'cancelled'))::int AS active_booking_count,
        COUNT(*) FILTER (WHERE sr.status = 'pending')::int AS pending_booking_count,
        COUNT(*) FILTER (WHERE sr.status = 'accepted')::int AS accepted_booking_count,
        COUNT(*) FILTER (WHERE sr.status IN ('intransit', 'delivering'))::int AS in_transit_booking_count,
        COUNT(*) FILTER (WHERE sr.status = 'completed')::int AS completed_booking_count,
        COUNT(*) FILTER (WHERE sr.status = 'rejected')::int AS rejected_booking_count,
        COUNT(*) FILTER (WHERE sr.status = 'cancelled')::int AS cancelled_booking_count
      FROM public.shipment_requests sr
      LEFT JOIN public.packages pkg ON pkg.id = sr.package_id
      WHERE sr.trip_id = $1
    `,
    [tripId],
  );

  const aggregate = aggregateResult.rows[0] || {};
  const totalKg = toNumber(trip.total_kg);
  const soldKg = toNumber(aggregate.sold_kg);
  const reservedKg = toNumber(aggregate.reserved_kg);
  const availableKg = Math.max(0, Number((totalKg - soldKg - reservedKg).toFixed(3)));
  const grossSales = Number((soldKg * toNumber(trip.price_per_kg)).toFixed(2));
  const commissionAmount = 0;
  const travelerEarnings = Number((grossSales - commissionAmount).toFixed(2));

  return {
    tripId: trip.id,
    userId: trip.user_id,
    status: trip.status,
    kycStatus: trip.kyc_status,
    departureDate: trip.departure_date,
    arrivalDate: trip.arrival_date,
    totalKg,
    soldKg,
    reservedKg,
    availableKg,
    pricePerKg: toNumber(trip.price_per_kg),
    currency: trip.currency,
    activeShipmentCount: Number(aggregate.active_booking_count || 0),
    pendingBookingCount: Number(aggregate.pending_booking_count || 0),
    acceptedBookingCount: Number(aggregate.accepted_booking_count || 0),
    inTransitBookingCount: Number(aggregate.in_transit_booking_count || 0),
    completedBookingCount: Number(aggregate.completed_booking_count || 0),
    rejectedBookingCount: Number(aggregate.rejected_booking_count || 0),
    cancelledBookingCount: Number(aggregate.cancelled_booking_count || 0),
    grossSales,
    commissionAmount,
    travelerEarnings,
  };
}

export async function syncTripCapacity(executor, tripId, { lockTrip = false } = {}) {
  const snapshot = await buildTripCapacitySnapshot(executor, tripId, { lockTrip });
  if (!snapshot) return null;

  await executor.query(
    `
      UPDATE public.trips
      SET
        total_kg = $2,
        sold_kg = $3,
        reserved_kg = $4,
        available_kg = $5,
        request_count = $6,
        updated_at = timezone('utc', now())
      WHERE id = $1
    `,
    [
      tripId,
      snapshot.totalKg,
      snapshot.soldKg,
      snapshot.reservedKg,
      snapshot.availableKg,
      snapshot.activeShipmentCount,
    ],
  );

  return snapshot;
}
