import { query } from '../lib/postgres/db.js';

const baseTripSelect = `
  SELECT
    t.id, t.id as "_id",
    t.user_id,
    t.from_location as "fromLocation",
    t.from_country as "fromCountry",
    t.to_location as "toLocation",
    t.to_country as "toCountry",
    t.collection_city as "collectionCity",
    t.collection_country as "collectionCountry",
    t.price_per_kg as "pricePerKg",
    t.currency,
    t.landmark,
    t.departure_date as "departureDate",
    t.arrival_date as "arrivalDate",
    t.available_kg as "availableKg",
    t.travel_means as "travelMeans",
    t.status,
    t.request_count as "request",
    t.travel_document_url as "travelDocument",
    t.travel_document_verified as "travelDocumentVerified",
    t.created_at as "createdAt",
    t.updated_at as "updatedAt",
    p.id as "user_profile_id",
    p.first_name as "user_firstName",
    p.last_name as "user_lastName",
    p.email as "user_email",
    p.image_url as "user_image",
    p.selected_avatar as "user_selectedAvatar",
    p.kyc_status as "user_kycStatus",
    p.rating as "user_average_rating",
    p.completed_trips as "user_total_trips"
  FROM public.trips t
  LEFT JOIN public.profiles p ON p.id = t.user_id
`;

export const getTravelers = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;
    const rawFrom = (req.query.fromLocation || req.query.from || '').toString().trim();
    const rawTo = (req.query.toLocation || req.query.to || '').toString().trim();
    const date = (req.query.date || '').toString().trim();
    const explicitFromCountry = (req.query.fromCountry || '').toString().trim();
    const explicitToCountry = (req.query.toCountry || '').toString().trim();

    const splitLocation = (value) => {
      if (!value) return { city: '', country: '' };
      const parts = value.split(',').map((p) => p.trim()).filter(Boolean);
      return { city: parts[0] || '', country: parts.slice(1).join(', ') || '' };
    };

    const fromParts = splitLocation(rawFrom);
    const toParts = splitLocation(rawTo);
    const fromCountry = explicitFromCountry || fromParts.country;
    const toCountry = explicitToCountry || toParts.country;
    const fromLocation = fromParts.city || rawFrom;
    const toLocation = toParts.city || rawTo;

    // Fetch active trips — include pending_admin_review so new trips show immediately
    const params = [];
    let whereClause = `WHERE t.status IN ('active', 'verified', 'pending_admin_review')`;
    if (currentUserId) {
      params.push(currentUserId);
      whereClause += ` AND t.user_id != $${params.length}`;
    }

    // SQL Optimization: Pre-filter by location to avoid fetching thousands of irrelevant rows
    if (fromLocation || toLocation || fromCountry || toCountry) {
      const filters = [];
      if (fromLocation) {
        params.push(`%${fromLocation}%`);
        filters.push(`t.from_location ILIKE $${params.length}`);
      }
      if (fromCountry) {
        params.push(`%${fromCountry}%`);
        filters.push(`t.from_country ILIKE $${params.length}`);
      }
      if (toLocation) {
        params.push(`%${toLocation}%`);
        filters.push(`t.to_location ILIKE $${params.length}`);
      }
      if (toCountry) {
        params.push(`%${toCountry}%`);
        filters.push(`t.to_country ILIKE $${params.length}`);
      }

      if (filters.length > 0) {
        whereClause += ` AND (${filters.join(' OR ')})`;
      }
    }

    const result = await query(
      `${baseTripSelect} ${whereClause} ORDER BY t.updated_at DESC LIMIT 500`,
      params
    );

    const allTrips = result.rows.map((row) => ({
      id: row.id,
      _id: row.id,
      userId: row.user_id,
      fromLocation: row.fromLocation,
      fromCountry: row.fromCountry,
      toLocation: row.toLocation,
      toCountry: row.toCountry,
      collectionCity: row.collectionCity,
      collectionCountry: row.collectionCountry,
      pricePerKg: parseFloat(row.pricePerKg) || 0,
      currency: row.currency,
      landmark: row.landmark,
      departureDate: row.departureDate,
      arrivalDate: row.arrivalDate,
      availableKg: parseFloat(row.availableKg) || 0,
      travelMeans: row.travelMeans,
      status: row.status,
      request: row.request || 0,
      travelDocument: row.travelDocument,
      travelDocumentVerified: row.travelDocumentVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      user: row.user_profile_id ? {
        _id: row.user_profile_id,
        id: row.user_profile_id,
        firstName: row.user_firstName,
        lastName: row.user_lastName,
        email: row.user_email,
        image: row.user_image,
        avatar: row.user_image,
        selectedAvatar: row.user_selectedAvatar,
        kycStatus: row.user_kycStatus,
        average_rating: row.user_average_rating,
        total_trips: row.user_total_trips,
      } : null,
    }));

    const searchActive = Boolean(fromLocation || toLocation || fromCountry || toCountry || date);
    const normalize = (v) => (v || '').toString().trim().toLowerCase();
    const matches = (value, candidate) => {
      const q = normalize(value);
      const t = normalize(candidate);
      if (!q || !t) return false;
      return t.includes(q) || q.includes(t);
    };
    const sameDay = (a, b) => {
      if (!a || !b) return false;
      const ad = new Date(a), bd = new Date(b);
      if (Number.isNaN(ad.getTime()) || Number.isNaN(bd.getTime())) return false;
      return ad.toDateString() === bd.toDateString();
    };
    const searchDate = date ? new Date(date) : null;

    const scoredTrips = allTrips
      .map((trip) => {
        let score = 0;
        let matched = false;

        if (fromLocation && matches(fromLocation, trip.fromLocation)) { score += 80; matched = true; }
        if (toLocation && matches(toLocation, trip.toLocation)) { score += 80; matched = true; }
        if (fromCountry && matches(fromCountry, trip.fromCountry)) { score += 45; matched = true; }
        if (toCountry && matches(toCountry, trip.toCountry)) { score += 45; matched = true; }

        if (fromLocation && toLocation &&
            matches(fromLocation, trip.fromLocation) &&
            matches(toLocation, trip.toLocation)) { score += 100; matched = true; }
        else if (fromCountry && toCountry &&
            matches(fromCountry, trip.fromCountry) &&
            matches(toCountry, trip.toCountry)) { score += 70; matched = true; }

        if (searchDate && sameDay(searchDate, trip.departureDate)) { score += 25; matched = true; }

        if (!searchActive) {
          score += new Date(trip.updatedAt || trip.createdAt || 0).getTime() / 1000000000;
          matched = true;
        }

        return { trip, score, matched };
      })
      .filter(({ matched }) => !searchActive || matched)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(a.trip.departureDate || 0) - new Date(b.trip.departureDate || 0);
      })
      .map(({ trip }) => trip);

    if (scoredTrips.length === 0) {
      return res.status(200).json({
        message: "No travelers found",
        data: { findUsers: [], gettravelers: [], travelers: [], trips: [] },
        success: true,
        error: false,
      });
    }

    // Build findUsers from the trip data directly (no second DB query needed)
    const seenUserIds = new Set();
    const findUsers = [];
    for (const trip of scoredTrips) {
      if (trip.user && !seenUserIds.has(trip.user.id)) {
        seenUserIds.add(trip.user.id);
        findUsers.push(trip.user);
      }
    }

    res.status(200).json({
      message: "Successfully retrieved travelers",
      data: { findUsers, gettravelers: scoredTrips, travelers: scoredTrips, trips: scoredTrips },
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error fetching travelers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
