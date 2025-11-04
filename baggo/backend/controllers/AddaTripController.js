import Trip from '../models/tripScheme.js'; // Corrected path (lowercase 'models')

// ✅ Add a new trip
export const AddAtrip = async (req, res, next) => {
  const userid = req.user.id;
  const { fromLocation, toLocation, departureDate, arrivalDate, availableKg, travelMeans } = req.body;

  try {
    // ✅ Validate required fields
    if (!fromLocation || !toLocation || !departureDate || !arrivalDate || !availableKg || !travelMeans) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ✅ Create the new trip
    const trip = new Trip({
      user: userid,
      fromLocation,
      toLocation,
      departureDate: new Date(departureDate),
      arrivalDate: new Date(arrivalDate), // <-- added here
      availableKg: parseFloat(availableKg),
      travelMeans: travelMeans.trim().toLowerCase(),
      status: "active",
    });

    await trip.save();

    // ✅ Send back clean response
    res.status(201).json({
      message: "Trip created successfully",
      trip: {
        id: trip._id,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        departureDate: trip.departureDate,
        arrivalDate: trip.arrivalDate, // <-- added here
        availableKg: trip.availableKg,
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
    const trips = await Trip.find({ user: userId }).select(
      '_id fromLocation toLocation departureDate arrivalDate availableKg travelMeans status request'
    );

    res.status(200).json({
      message: 'Trips retrieved successfully',
      trips: trips.map((trip) => ({
        id: trip._id,
        userId: trip.user,
        fromLocation: trip.fromLocation,
        toLocation: trip.toLocation,
        departureDate: trip.departureDate,
        arrivalDate: trip.arrivalDate, // <-- added here
        availableKg: trip.availableKg,
        travelMeans: trip.travelMeans,
        status: trip.status,
        request: trip.request,
      })),
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};
