import { getBusinessRestrictionState } from '../services/businessRestrictionService.js';

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

    // Business accounts are fully usable (no KYC gate) during their 14-day
    // grace period — see services/businessRestrictionService.js.
    const restriction = getBusinessRestrictionState(user);
    if (restriction.graceActive) {
      return next();
    }

    const kycStatus = String(user.kycStatus || user.kyc_status || '')
      .trim()
      .toLowerCase();
    const hasPassedKyc = ['approved', 'verified', 'completed'].includes(kycStatus);

    // Check if user is KYC verified
    if (!hasPassedKyc) {
      if (restriction.restricted) {
        return res.status(403).json({
          success: false,
          message: 'Your business account is restricted. Complete KYC and business document verification to restore access.',
          code: 'BUSINESS_ACCOUNT_RESTRICTED',
          kycStatus: kycStatus || user.kycStatus,
        });
      }
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
