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

    const kycStatus = String(user.kycStatus || user.kyc_status || '')
      .trim()
      .toLowerCase();
    const hasPassedKyc = ['approved', 'verified', 'completed'].includes(kycStatus);

    // Check if user is KYC verified
    if (!hasPassedKyc) {
      return res.status(403).json({
        success: false,
        message: `KYC verification required. Current status: ${kycStatus || 'not_started'}`,
        code: 'VERIFICATION_REQUIRED',
        kycStatus: kycStatus || user.kycStatus,
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
