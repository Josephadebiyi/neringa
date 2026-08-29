import crypto from 'crypto';
import cloudinary from 'cloudinary';
import { findProfileById } from '../../lib/postgres/profiles.js';
import { createTripRecord, getTripById } from '../../lib/postgres/trips.js';
import { validateTripInput } from '../../lib/trips/validateTripInput.js';

async function uploadTravelDocument(base64DataUri, userId) {
  if (!base64DataUri || !base64DataUri.startsWith('data:')) return base64DataUri;
  try {
    const result = await cloudinary.v2.uploader.upload(base64DataUri, {
      folder: 'bago/travel_documents',
      public_id: `trip_proof_${userId}_${Date.now()}`,
      resource_type: 'image',
      format: 'jpg',
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary travel document upload failed:', err.message);
    return base64DataUri;
  }
}

// Admin creates one or more trips (bulk dates supported, same as a business's
// own multi-date post) directly on behalf of a business account. Unlike every
// other trip-creation path, these go live immediately: the admin IS the
// approval step, so there is no pending_admin_review queue for these.
export const createTripForBusiness = async (req, res, next) => {
  const {
    businessUserId,
    fromLocation, fromCountry, toLocation, toCountry,
    collectionCity, collectionCountry,
    departureDate, departureDates, arrivalDate, availableKg, travelMeans,
    pricePerKg, landmark, travelDocument,
  } = req.body;

  try {
    if (!businessUserId) {
      return res.status(400).json({ message: 'businessUserId is required', success: false });
    }

    const business = await findProfileById(businessUserId);
    if (!business) {
      return res.status(404).json({ message: 'Business account not found', success: false });
    }
    if (business.accountType !== 'company') {
      return res.status(400).json({ message: 'The selected account is not a business account', success: false });
    }
    if (!business.preferredCurrency) {
      return res.status(400).json({
        message: 'This business has not set a wallet receiving currency yet — set it on their account before posting a trip on their behalf.',
        errorType: 'WALLET_CURRENCY_REQUIRED',
        success: false,
      });
    }

    // The trip must always be priced in the business's own payout currency —
    // never a client-supplied value — otherwise downstream payout/earnings
    // calculations (which assume trip currency == wallet currency) break.
    const currency = business.preferredCurrency;

    const validation = validateTripInput({
      fromLocation, fromCountry, toLocation, toCountry,
      departureDate, departureDates, arrivalDate,
      availableKg, travelMeans, pricePerKg, currency,
      allowMultipleDates: true,
    });
    if (validation.error) {
      return res.status(validation.error.status).json({ ...validation.error.body, success: false });
    }
    const { parsedDates, price, weight } = validation;

    const travelDocumentUrl = travelDocument
      ? await uploadTravelDocument(travelDocument, businessUserId)
      : null;

    const batchId = crypto.randomUUID();

    const createdTrips = [];
    for (const { departureAt, arrivalAt } of parsedDates) {
      const trip = await createTripRecord({
        userId: businessUserId,
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
        proofExempt: true,
        travelDocumentVerified: true,
        status: 'active',
        batchId,
      });
      createdTrips.push(await getTripById(trip.id));
    }

    res.status(201).json({
      message: createdTrips.length > 1
        ? `${createdTrips.length} trips created and are live on ${business.tradingName || business.companyName || 'the business'}'s account.`
        : `Trip created and is live on ${business.tradingName || business.companyName || 'the business'}'s account.`,
      trip: createdTrips[0],
      trips: createdTrips,
      count: createdTrips.length,
      success: true,
    });
  } catch (error) {
    next(error);
  }
};
