import Trip from "../models/tripScheme.js";
import User from "../models/userScheme.js";

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
      const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
      return {
        city: parts[0] || '',
        country: parts.slice(1).join(', ') || '',
      };
    };

    const fromParts = splitLocation(rawFrom);
    const toParts = splitLocation(rawTo);
    const fromCountry = explicitFromCountry || fromParts.country;
    const toCountry = explicitToCountry || toParts.country;
    const fromLocation = fromParts.city || rawFrom;
    const toLocation = toParts.city || rawTo;

    // ✅ Base Query: Verified/active and not current user
    const baseQuery = currentUserId
      ? { user: { $ne: currentUserId }, status: { $in: ['verified', 'active', 'upcoming'] } }
      : { status: { $in: ['verified', 'active', 'upcoming'] } };

    const allTrips = await Trip.find(baseQuery)
      .populate('user', 'firstName image kycStatus average_rating total_trips')
      .lean();

    const searchActive = Boolean(fromLocation || toLocation || fromCountry || toCountry || date);
    const normalize = (value) => (value || '').toString().trim().toLowerCase();
    const matches = (value, candidate) => {
      const query = normalize(value);
      const target = normalize(candidate);
      if (!query || !target) return false;
      return target.includes(query) || query.includes(target);
    };
    const sameDay = (a, b) => {
      if (!a || !b) return false;
      const ad = new Date(a);
      const bd = new Date(b);
      if (Number.isNaN(ad.getTime()) || Number.isNaN(bd.getTime())) return false;
      return ad.toDateString() === bd.toDateString();
    };
    const parseSearchDate = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return parsed;
      return null;
    };
    const searchDate = parseSearchDate(date);

    const scoredTrips = allTrips
      .map((trip) => {
        let score = 0;
        let matched = false;

        const tripFromLocation = normalize(trip.fromLocation);
        const tripToLocation = normalize(trip.toLocation);
        const tripFromCountry = normalize(trip.fromCountry);
        const tripToCountry = normalize(trip.toCountry);

        if (fromLocation && matches(fromLocation, tripFromLocation)) {
          score += 80;
          matched = true;
        }
        if (toLocation && matches(toLocation, tripToLocation)) {
          score += 80;
          matched = true;
        }
        if (fromCountry && matches(fromCountry, tripFromCountry)) {
          score += 45;
          matched = true;
        }
        if (toCountry && matches(toCountry, tripToCountry)) {
          score += 45;
          matched = true;
        }

        const exactRoute =
          fromLocation && toLocation &&
          matches(fromLocation, tripFromLocation) &&
          matches(toLocation, tripToLocation);
        const exactCountryRoute =
          fromCountry && toCountry &&
          matches(fromCountry, tripFromCountry) &&
          matches(toCountry, tripToCountry);

        if (exactRoute) {
          score += 100;
          matched = true;
        } else if (exactCountryRoute) {
          score += 70;
          matched = true;
        }

        if (searchDate && sameDay(searchDate, trip.departureDate)) {
          score += 25;
          matched = true;
        }

        if (!searchActive) {
          score += new Date(trip.updatedAt || trip.createdAt || 0).getTime() / 1000000000;
          matched = true;
        }

        return { trip, score, matched };
      })
      .filter(({ matched }) => !searchActive || matched)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const aDate = new Date(a.trip.departureDate || a.trip.createdAt || 0).getTime();
        const bDate = new Date(b.trip.departureDate || b.trip.createdAt || 0).getTime();
        return aDate - bDate;
      })
      .map(({ trip }) => trip);

    if (scoredTrips.length === 0) {
      return res.status(200).json({
        message: "No travelers found",
        data: { findUsers: [], gettravelers: [] },
        success: true,
        error: false,
      });
    }

    // ✅ Collect all unique user IDs from trips
    const userIds = [...new Set(scoredTrips.map(trip => trip.user?._id?.toString?.() || trip.user?.toString?.() || trip.user))];

    // ✅ Fetch all those users at once - SELECT ONLY firstName for privacy
    // Only the admin panel should display the full names.
    const findUsers = await User.find({ _id: { $in: userIds } }).select('firstName image kycStatus average_rating total_trips');

    const data = {
      findUsers,
      gettravelers: scoredTrips,
    };

    res.status(200).json({
      message: "Successfully retrieved travelers",
      data,
      success: true,
      error: false,
    });
  } catch (error) {
    console.error("Error fetching travelers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
