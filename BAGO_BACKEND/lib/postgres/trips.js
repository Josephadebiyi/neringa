import { query, queryOne, withTransaction } from './db.js';

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
    availableKg: toNumber(row.available_kg),
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
    t.available_kg,
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
    p.selected_avatar as user_selected_avatar
  from public.trips t
  left join public.profiles p on p.id = t.user_id
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
        available_kg,
        travel_means,
        price_per_kg,
        currency,
        landmark,
        travel_document_url,
        travel_document_uploaded_at,
        status
      )
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'pending_admin_review')
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
  const row = await queryOne(`${baseTripSelect} where t.id = $1`, [tripId]);
  if (!row) return null;
  return normalizeTripRow(row, await fetchTripReviews(tripId));
}

export async function getTripOwnedByUser(tripId, userId) {
  const row = await queryOne(`${baseTripSelect} where t.id = $1 and t.user_id = $2`, [tripId, userId]);
  if (!row) return null;
  return normalizeTripRow(row, await fetchTripReviews(tripId));
}

export async function updateTripRecord(tripId, userId, updates) {
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
  const deleted = await queryOne(
    `
      delete from public.trips
      where id = $1 and user_id = $2
      returning id
    `,
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
