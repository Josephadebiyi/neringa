import Trip from "../models/tripScheme.js";
import User from "../models/userScheme.js";

export const getTravelers = async (req, res, next) => {
  try {
    const gettravelers = await Trip.find();
    if (gettravelers.length === 0) {
      return res.status(404).json({ message: "There is no traveler available yet" });
    }

    // ✅ Collect all unique user IDs from trips
    const userIds = [...new Set(gettravelers.map(trip => trip.user))];

    // ✅ Fetch all those users at once
    const findUsers = await User.find({ _id: { $in: userIds } });

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
