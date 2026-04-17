import cloudinary from 'cloudinary';
import { findProfileById } from '../lib/postgres/profiles.js';
import {
  createTripRecord,
  listTripsByUserId,
  getTripById,
  getTripOwnedByUser,
  updateTripRecord,
  deleteTripRecord,
  addTripReview,
  getTripPricingSettings,
  listActiveAdminEmails,
  userHasCompletedTripRequest,
} from '../lib/postgres/trips.js';
import { getExchangeRate, convertCurrency } from '../services/currencyConverter.js';
import { sendNewTripAdminNotification } from '../services/emailNotifications.js';
import { query } from '../lib/postgres/db.js';

// Upload base64 travel document to Cloudinary and return the secure URL
async function uploadTravelDocument(base64DataUri, userId) {
  if (!base64DataUri || !base64DataUri.startsWith('data:')) return base64DataUri;
  try {
    const result = await cloudinary.v2.uploader.upload(base64DataUri, {
      folder: 'bago/travel_documents',
      public_id: `trip_proof_${userId}_${Date.now()}`,
      resource_type: 'auto',
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary travel document upload failed:', err.message);
    // Fall back to storing the base64 if Cloudinary fails
    return base64DataUri;
  }
}

const normalizeLocation = (value = '') =>
  value.toString().trim().toLowerCase().replace(/\s+/g, ' ');

const isSameRoute = (fromLocation, fromCountry, toLocation, toCountry) => {
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

// ✅ Add a new trip
export const AddAtrip = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  const userid = req.user.id || req.user._id;
  const {
    fromLocation, fromCountry, toLocation, toCountry,
    collectionCity, collectionCountry,
    departureDate, arrivalDate, availableKg, travelMeans,
    pricePerKg, currency, landmark, travelDocument
  } = req.body;

  try {
    // Check if user has wallet currency set
    const user = await findProfileById(userid);
    if (!user || !user.preferredCurrency) {
      return res.status(403).json({
        message: "Please set your wallet receiving currency in your profile settings before posting a trip.",
        errorType: "WALLET_CURRENCY_REQUIRED"
      });
    }

    // Validate required fields
    if (!fromLocation || !toLocation || !departureDate || !availableKg || !travelMeans || !pricePerKg || !currency) {
      return res.status(400).json({ message: "All fields are required, including price and currency" });
    }

    if (isSameRoute(fromLocation, fromCountry, toLocation, toCountry)) {
      return res.status(400).json({
        message: "Departure and destination must be different cities.",
      });
    }

    const departureAt = new Date(departureDate);
    const arrivalAt = arrivalDate ? new Date(arrivalDate) : new Date(departureAt);
    if (Number.isNaN(departureAt.getTime())) {
      return res.status(400).json({ message: "Invalid departure date" });
    }
    if (Number.isNaN(arrivalAt.getTime())) {
      return res.status(400).json({ message: "Invalid arrival date" });
    }

    const price = parseFloat(pricePerKg);
    const weight = parseFloat(availableKg);

    // Price Validation: Max 15 USD
    const priceInUSD = await convertCurrency(price, currency, 'USD');
    if (priceInUSD.convertedAmount > 15) {
      return res.status(400).json({ message: "Maximum price allowed is 15 USD per kg" });
    }

    // African Pricing Rule (Max 6000 NGN)
    const { supportedAfricanCurrencies } = await getTripPricingSettings();
    const isAfricanCurrency = supportedAfricanCurrencies.includes(currency.toUpperCase());
    const isNigeriaRoute =
      fromCountry?.toUpperCase() === 'NG' ||
      fromCountry?.toUpperCase() === 'NIGERIA' ||
      toCountry?.toUpperCase() === 'NG' ||
      toCountry?.toUpperCase() === 'NIGERIA';

    if (isAfricanCurrency || isNigeriaRoute) {
      const maxNaira = 6000;
      const priceInNaira = await convertCurrency(price, currency, 'NGN');
      if (priceInNaira.convertedAmount > maxNaira) {
        const rateToLocal = await getExchangeRate('NGN', currency);
        const localMax = Math.round(maxNaira * rateToLocal);
        return res.status(400).json({
          message: `Maximum price for this region is ${localMax} ${currency} (equivalent to 6000 NGN)`
        });
      }
    }

    // Upload travel document to Cloudinary to get a permanent URL
    const travelDocumentUrl = travelDocument
      ? await uploadTravelDocument(travelDocument, userid)
      : null;

    // Create the trip (auto-approved as 'active' so it appears in search)
    const trip = await createTripRecord({
      userId: userid,
      fromLocation,
      fromCountry,
      toLocation,
      toCountry,
      collectionCity: collectionCity || null,
      collectionCountry: collectionCountry || null,
      departureDate: departureAt,
      arrivalDate: arrivalAt,
      availableKg: weight,
      travelMeans: travelMeans.trim().toLowerCase(),
      pricePerKg: price,
      currency,
      landmark: landmark || '',
      travelDocument: travelDocumentUrl,
    });

    const activeTrip = await getTripById(trip.id);

    // Notify admins
    try {
      const adminEmails = await listActiveAdminEmails();
      const travelerName = user.firstName || 'A user';
      for (const email of adminEmails) {
        await sendNewTripAdminNotification(email, travelerName, activeTrip).catch(() => {});
      }
    } catch (adminErr) {
      console.error('Failed to notify admins:', adminErr.message);
    }

    res.status(201).json({
      message: "Trip created successfully",
      trip: activeTrip,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get user's trips
export const MyTrips = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const trips = await listTripsByUserId(userId);

    res.status(200).json({
      message: 'Trips retrieved successfully',
      trips,
    });
  } catch (error) {
    console.error('MyTrips error:', error);
    res.status(400).json({ message: error.message });
  }
};

export const GetTripById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const trip = await getTripById(id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    res.status(200).json({
      message: 'Trip retrieved successfully',
      trip,
    });
  } catch (error) {
    next(error);
  }
};

export const UpdateTrip = async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const tripId = req.params.id;
  const {
    fromLocation, fromCountry, toLocation, toCountry,
    departureDate, arrivalDate, availableKg, travelMeans,
    pricePerKg, currency, landmark
  } = req.body;

  try {
    const existing = await getTripOwnedByUser(tripId, userId);
    if (!existing) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const nextFromLocation = fromLocation ?? existing.fromLocation;
    const nextFromCountry = fromCountry ?? existing.fromCountry;
    const nextToLocation = toLocation ?? existing.toLocation;
    const nextToCountry = toCountry ?? existing.toCountry;

    if (isSameRoute(nextFromLocation, nextFromCountry, nextToLocation, nextToCountry)) {
      return res.status(400).json({
        message: "Departure and destination must be different cities.",
      });
    }

    const updates = {};

    if (pricePerKg !== undefined && currency !== undefined) {
      const price = parseFloat(pricePerKg);
      const priceInUSD = await convertCurrency(price, currency, 'USD');
      if (priceInUSD.convertedAmount > 15) {
        return res.status(400).json({ message: "Maximum price allowed is 15 USD per kg" });
      }

      const { supportedAfricanCurrencies } = await getTripPricingSettings();
      const isAfricanCurrency = supportedAfricanCurrencies.includes(currency.toUpperCase());
      const isNigeriaRoute =
        (fromCountry || existing.fromCountry)?.toUpperCase() === 'NG' ||
        (fromCountry || existing.fromCountry)?.toUpperCase() === 'NIGERIA' ||
        (toCountry || existing.toCountry)?.toUpperCase() === 'NG' ||
        (toCountry || existing.toCountry)?.toUpperCase() === 'NIGERIA';

      if (isAfricanCurrency || isNigeriaRoute) {
        const maxNaira = 6000;
        const priceInNaira = await convertCurrency(price, currency, 'NGN');
        if (priceInNaira.convertedAmount > maxNaira) {
          const rateToLocal = await getExchangeRate('NGN', currency);
          const localMax = Math.round(maxNaira * rateToLocal);
          return res.status(400).json({
            message: `Maximum price for this region is ${localMax} ${currency} (equivalent to 6000 NGN)`
          });
        }
      }
      updates.price_per_kg = price;
      updates.currency = currency;
    }

    // Handle travel document update
    const { travelDocument: travelDocRaw } = req.body;
    if (travelDocRaw) {
      updates.travel_document_url = await uploadTravelDocument(travelDocRaw, userId);
      updates.travel_document_uploaded_at = new Date();
    }

    if (fromLocation) updates.from_location = fromLocation;
    if (fromCountry) updates.from_country = fromCountry;
    if (toLocation) updates.to_location = toLocation;
    if (toCountry) updates.to_country = toCountry;
    if (landmark) updates.landmark = landmark;
    if (travelMeans) updates.travel_means = travelMeans.trim().toLowerCase();
    if (availableKg) updates.available_kg = parseFloat(availableKg);

    if (departureDate) {
      const departureAt = new Date(departureDate);
      if (Number.isNaN(departureAt.getTime())) {
        return res.status(400).json({ message: "Invalid departure date" });
      }
      updates.departure_date = departureAt;
      if (!arrivalDate) updates.arrival_date = departureAt;
    }
    if (arrivalDate) {
      const arrivalAt = new Date(arrivalDate);
      if (Number.isNaN(arrivalAt.getTime())) {
        return res.status(400).json({ message: "Invalid arrival date" });
      }
      updates.arrival_date = arrivalAt;
    }

    // Edited trips must be re-reviewed by admin
    updates.status = 'pending_admin_review';

    const updated = await updateTripRecord(tripId, userId, updates);
    if (!updated) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.status(200).json({
      message: "Trip updated successfully",
      trip: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const AddReviewToTrip = async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const tripId = req.params.tripId;
  const { rating, comment } = req.body;

  try {
    if (rating == null || rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 0 and 5" });
    }

    const trip = await getTripById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const hasCompleted = await userHasCompletedTripRequest(userId, tripId);
    if (!hasCompleted) {
      return res.status(403).json({
        message: "You can only rate travelers after a successful (completed) trip."
      });
    }

    await addTripReview({ tripId, userId, rating, comment });
    const updatedTrip = await getTripById(tripId);

    res.status(200).json({
      message: "Review added successfully",
      reviews: updatedTrip.reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Delete a trip
export const DeleteTrip = async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  const tripId = req.params.id;

  try {
    const deleted = await deleteTripRecord(tripId, userId);
    if (!deleted) {
      return res.status(404).json({ message: "Trip not found" });
    }

    res.status(200).json({
      message: "Trip deleted successfully",
      tripId,
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    next(error);
  }
};
