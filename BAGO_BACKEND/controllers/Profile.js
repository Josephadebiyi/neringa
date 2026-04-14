import { query } from '../lib/postgres/db.js';

export const Profile = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const userId = user.id;

    // Fetch user's trips from Postgres
    const tripsResult = await query(
      `SELECT
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
        t.updated_at as "updatedAt"
       FROM public.trips t
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC`,
      [userId]
    );

    const findTrips = tripsResult.rows.map(row => ({
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
    }));

    return res.status(200).json({
      message: findTrips.length === 0
        ? 'User found but no trips yet'
        : 'Gotten user profile successfully',
      success: true,
      error: false,
      data: {
        findUser: user,
        findTrips,
      },
    });
  } catch (error) {
    return next(error);
  }
};
