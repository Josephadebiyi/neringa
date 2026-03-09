import Trip from '../models/tripScheme.js';
import { getExchangeRate, convertCurrency } from '../services/currencyConverter.js';
import Setting from '../models/settingSheme.js';

// ✅ Add a new trip
export const AddAtrip = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  const userid = req.user.id;
  const {
    fromLocation, fromCountry, toLocation, toCountry,
    departureDate, arrivalDate, availableKg, travelMeans,
    pricePerKg, currency, landmark, travelDocument
  } = req.body;

  try {
    // ✅ Validate required fields
    if (!fromLocation || !toLocation || !departureDate || !arrivalDate || !availableKg || !travelMeans || !pricePerKg || !currency) {
      return res.status(400).json({ message: "All fields are required, including price and currency" });
    }

    const price = parseFloat(pricePerKg);
    const weight = parseFloat(availableKg);

    // ✅ Multi-layer Price Validation
    // 1. Global Max: 15 USD
    const priceInUSD = await convertCurrency(price, currency, 'USD');
    if (priceInUSD.convertedAmount > 15) {
      return res.status(400).json({ message: "Maximum price allowed is 15 USD per kg" });
    }

    // 2. African Pricing Rule (Max 6000 NGN equivalent for any African currency or Nigeria route)
    const settings = await Setting.findOne();
    const africanCurrencies = settings?.supportedAfricanCurrencies || ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF'];
    const isAfricanCurrency = africanCurrencies.includes(currency.toUpperCase());
    const isNigeriaRoute = fromCountry?.toUpperCase() === 'NG' || toCountry?.toUpperCase() === 'NG';

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

    // ✅ Create the new trip
    const trip = new Trip({
      user: userid,
      fromLocation,
      fromCountry,
      toLocation,
      toCountry,
      departureDate: new Date(departureDate),
      arrivalDate: new Date(arrivalDate),
      availableKg: weight,
      travelMeans: travelMeans.trim().toLowerCase(),
      pricePerKg: price,
      currency,
      landmark: landmark || '',
      travelDocument: travelDocument || null,
      documentVerified: false, // Will be verified by admin
      status: "active",
    });

    await trip.save();

    res.status(201).json({
      message: "Trip created successfully",
      trip: {
        id: trip._id,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        departureDate: trip.departureDate,
        arrivalDate: trip.arrivalDate,
        availableKg: trip.availableKg,
        pricePerKg: trip.pricePerKg,
        currency: trip.currency,
        landmark: trip.landmark,
        travelMeans: trip.travelMeans,
        status: trip.status,
        createdAt: trip.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get user's trips
export const MyTrips = async (req, res) => {
  try {
    const userId = req.user._id;

    // Include reviews in the query
    const trips = await Trip.find({ user: userId }).select(
      '_id fromLocation toLocation departureDate arrivalDate availableKg travelMeans status request reviews'
    ).populate('reviews.user', 'name email'); // optional: populate reviewer info

    const formattedTrips = trips.map((trip) => {
      // Calculate average rating
      const totalReviews = trip.reviews.length;
      const averageRating = totalReviews > 0
        ? trip.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

      return {
        id: trip._id,
        userId: trip.user,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        departureDate: trip.departureDate,
        arrivalDate: trip.arrivalDate,
        availableKg: trip.availableKg,
        travelMeans: trip.travelMeans,
        status: trip.status,
        request: trip.request,
        reviews: trip.reviews,           // full reviews array
        totalReviews,                    // number of reviews
        averageRating: parseFloat(averageRating.toFixed(2)), // rounded to 2 decimals
      };
    });

    res.status(200).json({
      message: 'Trips retrieved successfully',
      trips: formattedTrips,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};




export const UpdateTrip = async (req, res, next) => {
  const userId = req.user.id;
  const tripId = req.params.id;
  const {
    fromLocation, fromCountry, toLocation, toCountry,
    departureDate, arrivalDate, availableKg, travelMeans,
    pricePerKg, currency, landmark
  } = req.body;

  try {
    // ✅ Validate required fields
    if (!fromLocation || !toLocation || !departureDate || !arrivalDate || !availableKg || !travelMeans || !pricePerKg || !currency) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const price = parseFloat(pricePerKg);

    // ✅ Multi-layer Price Validation
    const priceInUSD = await convertCurrency(price, currency, 'USD');
    if (priceInUSD.convertedAmount > 15) {
      return res.status(400).json({ message: "Maximum price allowed is 15 USD per kg" });
    }

    const settings = await Setting.findOne();
    const africanCurrencies = settings?.supportedAfricanCurrencies || ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF'];
    const isAfricanCurrency = africanCurrencies.includes(currency.toUpperCase());
    const isNigeriaRoute = fromCountry?.toUpperCase() === 'NG' || toCountry?.toUpperCase() === 'NG' || trip.fromCountry === 'NG' || trip.toCountry === 'NG';

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

    // ✅ Find the trip and ensure it belongs to the user
    const trip = await Trip.findOne({ _id: tripId, user: userId });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // ✅ Update fields
    trip.fromLocation = fromLocation;
    trip.fromCountry = fromCountry || trip.fromCountry;
    trip.toLocation = toLocation;
    trip.toCountry = toCountry || trip.toCountry;
    trip.departureDate = departureDate;
    trip.arrivalDate = arrivalDate;
    trip.availableKg = parseFloat(availableKg);
    trip.pricePerKg = price;
    trip.currency = currency;
    trip.landmark = landmark || trip.landmark;
    trip.travelMeans = travelMeans.trim().toLowerCase();

    await trip.save();

    // ✅ Return updated trip
    res.status(200).json({
      message: "Trip updated successfully",
      trip: {
        id: trip._id,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        departureDate: trip.departureDate,
        arrivalDate: trip.arrivalDate,
        availableKg: trip.availableKg,
        pricePerKg: trip.pricePerKg,
        currency: trip.currency,
        landmark: trip.landmark,
        travelMeans: trip.travelMeans,
        status: trip.status,
        updatedAt: trip.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};




export const AddReviewToTrip = async (req, res, next) => {
  const userId = req.user.id;
  const tripId = req.params.tripId;
  const { rating, comment } = req.body;

  try {
    // Validate input
    if (rating == null || rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 0 and 5" });
    }

    // Find the trip
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Always add a new review
    trip.reviews.push({
      user: userId,
      rating,
      comment,
      date: new Date(),
    });

    await trip.save();

    res.status(200).json({
      message: "Review added successfully",
      reviews: trip.reviews,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Delete a trip
export const DeleteTrip = async (req, res, next) => {
  const userId = req.user.id;
  const tripId = req.params.id;

  try {
    // Find the trip and ensure it belongs to the user
    const trip = await Trip.findOne({ _id: tripId, user: userId });
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Check if trip has active requests (import Request model if needed)
    // For now, we'll allow deletion but you can add request checks here

    // Delete the trip
    await Trip.findByIdAndDelete(tripId);

    res.status(200).json({
      message: "Trip deleted successfully",
      tripId: tripId,
    });
  } catch (error) {
    console.error("Delete trip error:", error);
    next(error);
  }
};
