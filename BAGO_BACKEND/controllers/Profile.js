import User from '../models/userScheme.js';
import Trip from "../models/tripScheme.js";


export const Profile = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      throw new Error("No ID provided");
    }

    const findUser = await User.findById(userId).select("-password -__v -createdAt -updatedAt");
    if (!findUser) {
      throw new Error("User not found");
    }

    const findTrips = await Trip.find({ user: userId });

    // ✅ Always return both user and trips (even if no trips)
    const data = {
      findUser,
      findTrips,
    };

    return res.status(200).json({
      message:
        findTrips.length === 0
          ? "User found but no trips yet"
          : "Gotten user profile successfully",
      success: true,
      error: false,
      data,
    });
  } catch (error) {
    return next(error);
  }
};
