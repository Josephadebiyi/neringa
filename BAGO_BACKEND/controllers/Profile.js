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

    // ✅ CHECK: User must be KYC verified to access profile
    // If KYC is not approved, return verification required response
    if (findUser.kycStatus !== 'approved') {
      return res.status(100).json({
        message: `Account verification required. Current status: ${findUser.kycStatus || 'not_started'}`,
        success: false,
        error: true,
        code: 'VERIFICATION_REQUIRED',
        kycStatus: findUser.kycStatus,
        data: {
          findUser: {
            _id: findUser._id,
            email: findUser.email,
            firstName: findUser.firstName,
            lastName: findUser.lastName,
            kycStatus: findUser.kycStatus,
            kycVerifiedAt: findUser.kycVerifiedAt,
            kycFailureReason: findUser.kycFailureReason,
          },
          findTrips: [],
        },
      });
    }

    // ✅ If KYC is approved, proceed with full profile
    const findTrips = await Trip.find({ user: userId });

    // ✅ Return both user and trips (with verification status)
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
