import User from '../../models/userScheme.js';

/**
 * Get all users with KYC data
 * Admin only - view full KYC information
 */
export const getAllUsersKYC = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};

    // Filter by KYC status
    if (status && status !== 'all') {
      query.kycStatus = status;
    }

    // Search by name or email
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select(
        'firstName lastName email kycStatus kycVerifiedAt kycVerifiedData identityFingerprint kycFailureReason dateOfBirth country phone profileImage createdAt'
      )
      .sort({ kycVerifiedAt: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching KYC data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC data',
      error: error.message,
    });
  }
};

/**
 * Get detailed KYC information for a specific user
 * Admin only
 */
export const getUserKYCDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      'firstName lastName email phone country dateOfBirth ' +
      'kycStatus kycVerifiedAt kycVerifiedData kycFailureReason ' +
      'identityFingerprint diditSessionId status isVerified ' +
      'stripeVerified stripeConnectAccountId createdAt updatedAt'
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Format response with sensitive data (admin only)
    const kycDetails = {
      userId: user._id,
      personalInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        country: user.country,
        dateOfBirth: user.dateOfBirth,
      },
      kycStatus: {
        status: user.kycStatus,
        verifiedAt: user.kycVerifiedAt,
        failureReason: user.kycFailureReason,
        diditSessionId: user.diditSessionId,
      },
      verifiedData: user.kycVerifiedData
        ? {
            fullName: user.kycVerifiedData.fullName,
            firstName: user.kycVerifiedData.firstName,
            lastName: user.kycVerifiedData.lastName,
            dateOfBirth: user.kycVerifiedData.dateOfBirth,
            documentNumber: user.kycVerifiedData.documentNumber, // Show to admin
            documentType: user.kycVerifiedData.documentType,
            issuingCountry: user.kycVerifiedData.issuingCountry,
            verificationStatus: user.kycVerifiedData.verificationStatus,
          }
        : null,
      accountStatus: {
        isVerified: user.isVerified,
        accountStatus: user.status,
        stripeVerified: user.stripeVerified,
        hasStripeAccount: !!user.stripeConnectAccountId,
      },
      security: {
        identityFingerprint: user.identityFingerprint
          ? user.identityFingerprint.substring(0, 16) + '...'
          : null,
      },
      timestamps: {
        accountCreated: user.createdAt,
        lastUpdated: user.updatedAt,
      },
    };

    return res.status(200).json({
      success: true,
      data: kycDetails,
    });
  } catch (error) {
    console.error('❌ Error fetching user KYC details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user KYC details',
      error: error.message,
    });
  }
};

/**
 * Get KYC statistics for admin dashboard
 */
export const getKYCStatistics = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$kycStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ kycStatus: 'approved' });
    const pendingUsers = await User.countDocuments({ kycStatus: 'pending' });
    const declinedUsers = await User.countDocuments({
      kycStatus: { $in: ['declined', 'failed_verification', 'blocked_duplicate'] },
    });

    // Recent verifications (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentVerifications = await User.countDocuments({
      kycStatus: 'approved',
      kycVerifiedAt: { $gte: thirtyDaysAgo },
    });

    return res.status(200).json({
      success: true,
      statistics: {
        total: totalUsers,
        verified: verifiedUsers,
        pending: pendingUsers,
        declined: declinedUsers,
        verificationRate: totalUsers > 0 ? ((verifiedUsers / totalUsers) * 100).toFixed(2) : 0,
        recentVerifications30Days: recentVerifications,
        byStatus: stats.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching KYC statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC statistics',
      error: error.message,
    });
  }
};

/**
 * Manually approve/reject KYC (admin override)
 */
export const updateKYCStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['approved', 'declined', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: approved, declined, or pending',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const previousStatus = user.kycStatus;

    user.kycStatus = status;

    if (status === 'approved') {
      user.kycVerifiedAt = new Date();
      user.status = 'verified';
      user.isVerified = true;
      user.kycFailureReason = null;
    } else if (status === 'declined') {
      user.kycFailureReason = reason || 'Admin manual rejection';
      user.status = 'rejected';
      user.isVerified = false;
    } else if (status === 'pending') {
      user.kycFailureReason = null;
    }

    await user.save();

    console.log(
      `✅ Admin manually updated KYC status for user ${user.email}: ${previousStatus} → ${status}`
    );

    return res.status(200).json({
      success: true,
      message: `KYC status updated to ${status}`,
      data: {
        userId: user._id,
        email: user.email,
        previousStatus,
        newStatus: status,
        reason: reason || null,
      },
    });
  } catch (error) {
    console.error('❌ Error updating KYC status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update KYC status',
      error: error.message,
    });
  }
};
