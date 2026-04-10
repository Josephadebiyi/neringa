/**
 * KYC Verification Middleware
 * Ensures user is KYC verified before accessing sensitive endpoints
 */
export const requireKycVerification = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
        code: 'NOT_AUTHENTICATED',
      });
    }

    // Check if user is KYC verified
    if (user.kycStatus !== 'approved') {
      return res.status(100).json({
        success: false,
        message: `KYC verification required. Current status: ${user.kycStatus || 'not_started'}`,
        code: 'VERIFICATION_REQUIRED',
        kycStatus: user.kycStatus,
        data: {
          userId: user._id,
          email: user.email,
          kycStatus: user.kycStatus,
          kycVerifiedAt: user.kycVerifiedAt,
          kycFailureReason: user.kycFailureReason,
        },
      });
    }

    // User is verified, proceed to next middleware/controller
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error checking KYC verification',
      error: error.message,
    });
  }
};
