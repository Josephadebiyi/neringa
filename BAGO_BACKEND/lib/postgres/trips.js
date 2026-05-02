import { query, queryOne, withTransaction } from './db.js';
import { ensureTripCapacityColumns } from './tripCapacity.js';

const DEFAULT_AFRICAN_CURRENCIES = ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF'];

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeReviewRow(row) {
  if (!row) return null;

  const reviewer = row.user_id
    ? {
        _id: row.user_id,
        id: row.user_id,
        firstName: row.user_first_name,
        lastName: row.user_last_name,
        email: row.user_email,
        image: row.user_image_url,
        avatar: row.user_image_url,
        selectedAvatar: row.user_selected_avatar,
      }
    : null;

  return {
    user: reviewer,
    rating: toNumber(row.rating),
    comment: row.comment,
    date: row.created_at,
  };
}

function normalizeTripRow(row, reviews = []) {
  if (!row) return null;

  const normalizedReviews = reviews.filter(Boolean);
  const totalReviews = normalizedReviews.length;
  const averageRating = totalReviews
    ? Number((normalizedReviews.reduce((sum, review) => sum + toNumber(review.rating), 0) / totalReviews).toFixed(2))
    : 0;

  const user = row.user_id
    ? {
        _id: row.user_id,
        id: row.user_id,
        firstName: row.user_first_name,
        lastName: row.user_last_name,
        email: row.user_email,
        image: row.user_image_url,
        avatar: row.user_image_url,
        selectedAvatar: row.user_selected_avatar,
      }
    : null;

  return {
    id: row.id,
    _id: row.id,
    userId: row.user_id,
    user,
    fromLocation: row.from_location,
    fromCountry: row.from_country,
    toLocation: row.to_location,
    toCountry: row.to_country,
    collectionCity: row.collection_city,
    collectionCountry: row.collection_country,
    departureDate: row.departure_date,
    arrivalDate: row.arrival_date,
    totalKg: toNumber(row.total_kg, toNumber(row.available_kg)),
    availableKg: toNumber(row.available_kg),
    soldKg: toNumber(row.sold_kg),
    reservedKg: toNumber(row.reserved_kg),
    remainingKg: toNumber(row.available_kg),
    travelMeans: row.travel_means,
    status: row.status,
    request: toNumber(row.request_count),
    reviews: normalizedReviews,
    totalReviews,
    averageRating,
    pricePerKg: toNumber(row.price_per_kg),
    currency: row.currency,
    landmark: row.landmark,
    travelDocument: row.travel_document_url,
    travelDocumentVerified: row.travel_document_verified,
    travelDocumentUploadedAt: row.travel_document_uploaded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    activeShipmentCount: toNumber(row.active_shipment_count),
    bookingStatusSummary: row.booking_status_summary || 'No active bookings',
    grossSales: toNumber(row.gross_sales),
    commissionAmount: toNumber(row.commission_amount),
    travelerEarnings: toNumber(row.traveler_earnings),
    payoutAmount: toNumber(row.traveler_earnings),
    payoutStatus: row.payout_status || 'pending',
  };
}

const baseTripSelect = `
  select
    t.id,
    t.user_id,
    t.from_location,
    t.from_country,
    t.to_location,
    t.to_country,
    t.collection_city,
    t.collection_country,
    t.price_per_kg,
    t.currency,
    t.landmark,
    t.departure_date,
    t.arrival_date,
    coalesce(nullif(t.total_kg, 0), greatest(coalesce(t.available_kg, 0) + coalesce(trip_stats.sold_kg, 0) + coalesce(trip_stats.reserved_kg, 0), coalesce(t.available_kg, 0))) as total_kg,
    greatest(0, coalesce(nullif(t.total_kg, 0), greatest(coalesce(t.available_kg, 0) + coalesce(trip_stats.sold_kg, 0) + coalesce(trip_stats.reserved_kg, 0), coalesce(t.available_kg, 0))) - coalesce(trip_stats.sold_kg, 0) - coalesce(trip_stats.reserved_kg, 0)) as available_kg,
    coalesce(trip_stats.sold_kg, 0) as sold_kg,
    coalesce(trip_stats.reserved_kg, 0) as reserved_kg,
    t.travel_means,
    t.status,
    t.request_count,
    t.travel_document_url,
    t.travel_document_verified,
    t.travel_document_uploaded_at,
    t.created_at,
    t.updated_at,
    p.first_name as user_first_name,
    p.last_name as user_last_name,
    p.email as user_email,
    p.image_url as user_image_url,
    p.selected_avatar as user_selected_avatar,
    trip_stats.active_shipment_count,
    trip_stats.booking_status_summary,
    (coalesce(trip_stats.sold_kg, 0) * coalesce(t.price_per_kg, 0)) as gross_sales,
    0::numeric as commission_amount,
    (coalesce(trip_stats.sold_kg, 0) * coalesce(t.price_per_kg, 0)) as traveler_earnings,
    case
      when coalesce(trip_stats.completed_booking_count, 0) > 0 then 'partially_paid'
      when coalesce(trip_stats.active_shipment_count, 0) > 0 then 'pending'
      else 'pending'
    end as payout_status
  from public.trips t
  left join public.profiles p on p.id = t.user_id
  left join lateral (
    select
      coalesce(sum(case when sr.status = 'pending' then coalesce(pkg.package_weight, 0) else 0 end), 0) as reserved_kg,
      coalesce(sum(case when sr.status in ('accepted', 'intransit', 'delivering', 'completed') then coalesce(pkg.package_weight, 0) else 0 end), 0) as sold_kg,
      count(*) filter (where sr.status not in ('rejected', 'cancelled'))::int as active_shipment_count,
      count(*) filter (where sr.status = 'pending')::int as pending_booking_count,
      count(*) filter (where sr.status = 'accepted')::int as accepted_booking_count,
      count(*) filter (where sr.status in ('intransit', 'delivering'))::int as in_transit_booking_count,
      count(*) filter (where sr.status = 'completed')::int as completed_booking_count,
      trim(
        both ' ' from concat_ws(
          ' · ',
          case when count(*) filter (where sr.status = 'pending') > 0 then (count(*) filter (where sr.status = 'pending'))::text || ' pending' end,
          case when count(*) filter (where sr.status = 'accepted') > 0 then (count(*) filter (where sr.status = 'accepted'))::text || ' approved' end,
          case when count(*) filter (where sr.status in ('intransit', 'delivering')) > 0 then (count(*) filter (where sr.status in ('intransit', 'delivering')))::text || ' in transit' end,
          case when count(*) filter (where sr.status = 'completed') > 0 then (count(*) filter (where sr.status = 'completed'))::text || ' delivered' end
        )
      ) as booking_status_summary
    from public.shipment_requests sr
    left join public.packages pkg on pkg.id = sr.package_id
    where sr.trip_id = t.id
  ) trip_stats on true
`;

async function fetchTripReviews(tripId) {
  const result = await query(
    `
      select
        r.trip_id,
        r.user_id,
        r.rating,
        r.comment,
        r.created_at,
        p.first_name as user_first_name,
        p.last_name as user_last_name,
        p.email as user_email,
        p.image_url as user_image_url,
        p.selected_avatar as user_selected_avatar
      from public.trip_reviews r
      left join public.profiles p on p.id = r.user_id
      where r.trip_id = $1
      order by r.created_at desc
    `,
    [tripId],
  );

  return result.rows.map(normalizeReviewRow);
}

export async function getTripPricingSettings() {
  const settings = await queryOne(
    `
      select supported_african_currencies, max_global_price_usd, max_african_price_ngn
      from public.app_settings
      order by created_at asc
      limit 1
    `,
  );

  return {
    supportedAfricanCurrencies: settings?.supported_african_currencies || DEFAULT_AFRICAN_CURRENCIES,
    maxGlobalPriceUsd: toNumber(settings?.max_global_price_usd, 15),
    maxAfricanPriceNgn: toNumber(settings?.max_african_price_ngn, 6000),
  };
}

export async function createTripRecord({
  userId,
  fromLocation,
  fromCountry,
  toLocation,
  toCountry,
  collectionCity = null,
  collectionCountry = null,
  departureDate,
  arrivalDate,
  availableKg,
  travelMeans,
  pricePerKg,
  currency,
  landmark,
  travelDocument,
}) {
  await ensureTripCapacityColumns({ query });
  const trip = await queryOne(
    `
      insert into public.trips (
        user_id,
        from_location,
        from_country,
        to_location,
        to_country,
        collection_city,
        collection_country,
        departure_date,
        arrival_date,
        total_kg,
        available_kg,
        sold_kg,
        reserved_kg,
        travel_means,
        price_per_kg,
        currency,
        landmark,
        travel_document_url,
        travel_document_uploaded_at,
        status
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,0,0,$11,$12,$13,$14,$15,$16,'pending')
      returning id
    `,
    [
      userId,
      fromLocation,
      fromCountry,
      toLocation,
      toCountry,
      collectionCity,
      collectionCountry,
      departureDate,
      arrivalDate,
      availableKg,
      travelMeans,
      pricePerKg,
      currency,
      landmark,
      travelDocument,
      travelDocument ? departureDate : null,
    ],
  );

  return getTripById(trip.id);
}

export async function listTripsByUserId(userId) {
  await ensureTripCapacityColumns({ query });
  const result = await query(
    `${baseTripSelect}
      where t.user_id = $1
      order by t.created_at desc`,
    [userId],
  );

  return Promise.all(
    result.rows.map(async (row) => normalizeTripRow(row, await fetchTripReviews(row.id))),
  );
}

export async function getTripById(tripId) {
  await ensureTripCapacityColumns({ query });
  const row = await queryOne(`${baseTripSelect} where t.id = $1`, [tripId]);
  if (!row) return null;
  return normalizeTripRow(row, await fetchTripReviews(tripId));
}

export async function getTripOwnedByUser(tripId, userId) {
  await ensureTripCapacityColumns({ query });
  const row = await queryOne(`${baseTripSelect} where t.id = $1 and t.user_id = $2`, [tripId, userId]);
  if (!row) return null;
  return normalizeTripRow(row, await fetchTripReviews(tripId));
}

export async function updateTripRecord(tripId, userId, updates) {
  await ensureTripCapacityColumns({ query });
  const fields = [];
  const values = [];
  let index = 1;

  for (const [column, value] of Object.entries(updates)) {
    fields.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  }

  if (!fields.length) {
    return getTripOwnedByUser(tripId, userId);
  }

  values.push(tripId, userId);

  const updated = await queryOne(
    `
      update public.trips
      set ${fields.join(', ')}, updated_at = timezone('utc', now())
      where id = $${index} and user_id = $${index + 1}
      returning id
    `,
    values,
  );

  if (!updated) return null;
  return getTripById(updated.id);
}

export async function deleteTripRecord(tripId, userId) {
  // Block deletion if any non-cancelled/non-rejected requests exist for this trip
  const activeRequest = await queryOne(
    `SELECT id FROM public.shipment_requests
     WHERE trip_id = $1
       AND status NOT IN ('cancelled', 'rejected', 'completed', 'delivered')
     LIMIT 1`,
    [tripId],
  );
  if (activeRequest) {
    throw Object.assign(new Error('Cannot delete a trip that has active bookings. Cancel all bookings first.'), { code: 'TRIP_HAS_BOOKINGS' });
  }

  // Also block deletion if departure date has already passed — archive instead
  const trip = await queryOne(
    `SELECT departure_date FROM public.trips WHERE id = $1 AND user_id = $2`,
    [tripId, userId],
  );
  if (!trip) return false;

  if (trip.departure_date && new Date(trip.departure_date) < new Date()) {
    throw Object.assign(new Error('Past trips cannot be deleted. They are kept for history.'), { code: 'TRIP_ALREADY_DEPARTED' });
  }

  const deleted = await queryOne(
    `DELETE FROM public.trips WHERE id = $1 AND user_id = $2 RETURNING id`,
    [tripId, userId],
  );

  return Boolean(deleted);
}

export async function listActiveAdminEmails() {
  const result = await query(
    `
      select email
      from public.admin_users
      where is_active = true and email is not null and email <> ''
    `,
  );

  return result.rows.map((row) => row.email).filter(Boolean);
}

export async function userHasCompletedTripRequest(userId, tripId) {
  const record = await queryOne(
    `
      select id
      from public.shipment_requests
      where sender_id = $1 and trip_id = $2 and status = 'completed'
      limit 1
    `,
    [userId, tripId],
  );

  return Boolean(record);
}

export async function addTripReview({ tripId, userId, rating, comment }) {
  return withTransaction(async (client) => {
    const review = await client.query(
      `
        insert into public.trip_reviews (trip_id, user_id, rating, comment)
        values ($1, $2, $3, $4)
        returning id
      `,
      [tripId, userId, rating, comment || null],
    );

    return review.rows[0];
  });
}
