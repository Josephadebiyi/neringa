import { searchTravelerTrips } from '../lib/postgres/shipping.js';

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

    const searchResult = await searchTravelerTrips({
      currentUserId,
      fromLocation: fromLocation || null,
      toLocation: toLocation || null,
      fromCountry: fromCountry || null,
      toCountry: toCountry || null,
      date: date || null,
    });
    const scoredTrips = searchResult.trips;

    if (scoredTrips.length === 0) {
      return res.status(200).json({
        message: "No travelers found",
        data: { findUsers: [], gettravelers: [], travelers: [], trips: [] },
        success: true,
        error: false,
      });
    }

    const findUsers = searchResult.findUsers;

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
