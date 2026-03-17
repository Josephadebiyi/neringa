import Trip from "../models/tripScheme.js";
import User from "../models/userScheme.js";

export const getTravelers = async (req, res, next) => {
  try {
    const currentUserId = req.user?.id || req.user?._id;

    // ✅ Filter: Exclude user's own trips if authenticated and must be verified
    const query = currentUserId ? { user: { $ne: currentUserId }, status: 'verified' } : { status: 'verified' };

    const gettravelers = await Trip.find(query);
    if (gettravelers.length === 0) {
      return res.status(404).json({ message: "There is no traveler available yet" });
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
