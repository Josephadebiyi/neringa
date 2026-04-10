import User from '../../models/userScheme.js';
import Package from '../../models/PackageScheme.js';
import Request from '../../models/RequestScheme.js';
import Trip from '../../models/tripScheme.js';

export const dashboard = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch aggregate stats in parallel
    const [
      userCount,
      packageCount,
      requestCount,
      incomeStats,
      statusDistribution,
      monthlyTrends,
      activeTripsCount,
      googleSignupCount,
      unverifiedUserCount,
      verifiedUserCount
    ] =
      await Promise.all([
        User.countDocuments(),
        Package.countDocuments(),
        Request.countDocuments(),
        Request.aggregate([
          {
            $match: {
              status: { $in: ['accepted', 'picked_up', 'in_transit', 'delivered'] },
            },
          },
          { $group: { _id: null, totalIncome: { $sum: '$insuranceCost' } } },
        ]),
        Request.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              name: '$_id',
              count: 1,
              _id: 0,
            },
          },
        ]),
        Package.aggregate([
          {
            $match: {
              createdAt: {
                $gte: new Date(new Date().getFullYear() - 1, 0, 1),
              },
            },
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              count: { $sum: 1 },
            },
          },
          {
            $sort: { '_id.year': 1, '_id.month': 1 },
          },
          {
            $project: {
              year: '$_id.year',
              month: '$_id.month',
              count: 1,
              _id: 0,
            },
          },
        ]),
        Trip.countDocuments({ status: 'active' }),
        User.countDocuments({ signupMethod: 'google' }),
        User.countDocuments({ kycStatus: { $ne: 'approved' } }),
        User.countDocuments({ kycStatus: 'approved' }),
      ]);

    // Fetch packages with pagination and their requests
    const packages = await Package.find().skip(skip).limit(Number(limit));
    const trackingData = await Promise.all(
      packages.map(async (pkg) => {
        const requests = await Request.find({ package: pkg._id }).select(
          '_id sender traveler package trip status insurance insuranceCost createdAt updatedAt'
        );
        return {
          package: pkg,
          requests,
        };
      })
    );

    // Format monthly trends
    const thisYear = new Date().getFullYear();
    const lastYear = thisYear - 1;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const monthlyData = months.map((month, index) => ({
      name: month,
      thisYear: 0,
      lastYear: 0,
    }));

    monthlyTrends.forEach((trend) => {
      const monthIndex = trend.month - 1;
      if (trend.year === thisYear) {
        monthlyData[monthIndex].thisYear = trend.count;
      } else if (trend.year === lastYear) {
        monthlyData[monthIndex].lastYear = trend.count;
      }
    });

    const totalIncome = incomeStats.length > 0 ? incomeStats[0].totalIncome : 0;
    const totalCommission = totalIncome * 0.1;

    const totalRequests = statusDistribution.reduce((sum, status) => sum + status.count, 0);
    const statusData = statusDistribution.map((status) => ({
      name: status.name,
      value: totalRequests > 0 ? (status.count / totalRequests) * 100 : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: userCount,
          totalPackages: packageCount,
          totalRequests: requestCount,
          totalIncome,
          totalCommission,
          activeTrips: activeTripsCount,
          googleUsers: googleSignupCount,
          unverifiedUsers: unverifiedUserCount,
          verifiedUsers: verifiedUserCount
        },
        trackingData,
        statusDistribution: statusData,
        monthlyTrends: monthlyData,
        pagination: {
          totalCount: packageCount,
          page: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};