import Trip from "../models/tripScheme.js";
import User from "../models/userScheme.js";

export const getTravelers = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;
    const { fromCountry, toCountry, fromLocation, toLocation } = req.query;

    // ✅ Base Query: Verified and not current user
    let baseQuery = currentUserId ? { user: { $ne: currentUserId }, status: 'verified' } : { status: 'verified' };

    // ✅ Build specific search filters
    let exactMatchQuery = { ...baseQuery };
    if (fromCountry) exactMatchQuery.fromCountry = new RegExp(fromCountry, 'i');
    if (toCountry) exactMatchQuery.toCountry = new RegExp(toCountry, 'i');
    if (fromLocation) exactMatchQuery.fromLocation = new RegExp(fromLocation, 'i');
    if (toLocation) exactMatchQuery.toLocation = new RegExp(toLocation, 'i');

    // 1️⃣ Try exact match first
    let gettravelers = await Trip.find(exactMatchQuery);

    // 2️⃣ If no exact match AND we have search parameters, try similar matches (Country level)
    if (gettravelers.length === 0 && (fromCountry || toCountry)) {
      console.log("No exact match found, searching similar routes...");
      
      const similarQuery = {
        ...baseQuery,
        $or: []
      };

      if (fromCountry) similarQuery.$or.push({ fromCountry: new RegExp(fromCountry, 'i') });
      if (toCountry) similarQuery.$or.push({ toCountry: new RegExp(toCountry, 'i') });

      gettravelers = await Trip.find(similarQuery);
    }

    if (gettravelers.length === 0) {
      return res.status(200).json({
        message: "No travelers found",
        data: { findUsers: [], gettravelers: [] },
        success: true,
        error: false,
      });
    }

    // ✅ Collect all unique user IDs from trips
    const userIds = [...new Set(gettravelers.map(trip => trip.user))];

    // ✅ Fetch all those users at once - SELECT ONLY firstName for privacy
    // Only the admin panel should display the full names.
    const findUsers = await User.find({ _id: { $in: userIds } }).select('firstName image kycStatus average_rating total_trips');

    const data = {
      findUsers,
      gettravelers,
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
