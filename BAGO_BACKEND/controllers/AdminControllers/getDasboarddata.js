import { query, queryOne } from '../../lib/postgres/db.js';
import { getShipmentRequestById } from '../../lib/postgres/shipping.js';

export const dashboard = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const safeQuery = (sql, params) => query(sql, params).catch(() => ({ rows: [] }));
    const safeQueryOne = (sql, params) => queryOne(sql, params).catch(() => null);

    const [
      userCountRow,
      packageCountRow,
      requestCountRow,
      incomeRow,
      statusDistributionResult,
      monthlyTrendsResult,
      activeTripsCountRow,
      googleSignupCountRow,
      unverifiedUserCountRow,
      verifiedUserCountRow,
      packagesResult,
    ] = await Promise.all([
      safeQueryOne(`select count(*)::int as total from public.profiles`),
      safeQueryOne(`select count(*)::int as total from public.packages`),
      safeQueryOne(`select count(*)::int as total from public.shipment_requests`),
      safeQueryOne(`
        select coalesce(sum(insurance_cost), 0) as total_income
        from public.shipment_requests
        where status in ('accepted', 'picked_up', 'in_transit', 'delivered', 'intransit', 'completed')
      `),
      safeQuery(`
        select status as name, count(*)::int as count
        from public.shipment_requests
        group by status
      `),
      safeQuery(`
        select
          extract(year from created_at)::int as year,
          extract(month from created_at)::int as month,
          count(*)::int as count
        from public.packages
        where created_at >= $1
        group by 1, 2
        order by 1, 2
      `, [new Date(new Date().getFullYear() - 1, 0, 1)]),
      safeQueryOne(`select count(*)::int as total from public.trips where status = 'active'`),
      safeQueryOne(`select count(*)::int as total from public.profiles where signup_method = 'google'`),
      safeQueryOne(`select count(*)::int as total from public.profiles where coalesce(kyc_status, 'pending') <> 'approved'`),
      safeQueryOne(`select count(*)::int as total from public.profiles where kyc_status = 'approved'`),
      safeQuery(`select * from public.packages order by created_at desc limit $1 offset $2`, [limit, skip]),
    ]);

    const packageIds = (packagesResult.rows || []).map((row) => row.id);
    let requestIds = [];
    if (packageIds.length) {
      const packageRequests = await safeQuery(
        `select id from public.shipment_requests where package_id = any($1::uuid[]) order by created_at desc`,
        [packageIds],
      );
      requestIds = (packageRequests.rows || []).map((row) => row.id);
    }

    const requests = await Promise.all(requestIds.map((id) => getShipmentRequestById(id)));
    const requestsByPackage = new Map();
    for (const request of requests.filter(Boolean)) {
      const bucket = requestsByPackage.get(request.packageId) || [];
      bucket.push(request);
      requestsByPackage.set(request.packageId, bucket);
    }

    const trackingData = packagesResult.rows.map((pkg) => ({
      package: {
        _id: pkg.id,
        id: pkg.id,
        userId: pkg.user_id,
        fromCountry: pkg.from_country,
        fromCity: pkg.from_city,
        toCountry: pkg.to_country,
        toCity: pkg.to_city,
        packageWeight: Number(pkg.package_weight || 0),
        value: Number(pkg.declared_value || 0),
        receiverName: pkg.receiver_name,
        receiverEmail: pkg.receiver_email,
        receiverPhone: pkg.receiver_phone,
        description: pkg.description,
        image: pkg.image_url,
        category: pkg.category,
        createdAt: pkg.created_at,
      },
      requests: requestsByPackage.get(pkg.id) || [],
    }));

    const thisYear = new Date().getFullYear();
    const lastYear = thisYear - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month) => ({ name: month, thisYear: 0, lastYear: 0 }));

    for (const trend of monthlyTrendsResult.rows) {
      const monthIndex = Number(trend.month) - 1;
      if (monthIndex < 0 || monthIndex > 11) continue;
      if (Number(trend.year) === thisYear) monthlyData[monthIndex].thisYear = Number(trend.count || 0);
      if (Number(trend.year) === lastYear) monthlyData[monthIndex].lastYear = Number(trend.count || 0);
    }

    const totalRequests = statusDistributionResult.rows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const statusData = statusDistributionResult.rows.map((row) => ({
      name: row.name,
      value: totalRequests > 0 ? (Number(row.count || 0) / totalRequests) * 100 : 0,
    }));

    const totalIncome = Number(incomeRow?.total_income || 0);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: userCountRow?.total || 0,
          totalPackages: packageCountRow?.total || 0,
          totalRequests: requestCountRow?.total || 0,
          totalIncome,
          totalCommission: totalIncome * 0.1,
          activeTrips: activeTripsCountRow?.total || 0,
          googleUsers: googleSignupCountRow?.total || 0,
          unverifiedUsers: unverifiedUserCountRow?.total || 0,
          verifiedUsers: verifiedUserCountRow?.total || 0,
        },
        trackingData,
        statusDistribution: statusData,
        monthlyTrends: monthlyData,
        pagination: {
          totalCount: packageCountRow?.total || 0,
          page,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data',
      error: error.message,
    });
  }
};
