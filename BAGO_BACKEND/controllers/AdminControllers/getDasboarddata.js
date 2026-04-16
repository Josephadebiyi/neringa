import { query, queryOne } from '../../lib/postgres/db.js';

async function safeQueryOne(sql, params = [], fallback = {}) {
  try {
    return (await queryOne(sql, params)) || fallback;
  } catch (error) {
    console.error('Dashboard queryOne failed:', error.message);
    return fallback;
  }
}

async function safeQuery(sql, params = [], fallback = []) {
  try {
    const result = await query(sql, params);
    return result?.rows || fallback;
  } catch (error) {
    console.error('Dashboard query failed:', error.message);
    return fallback;
  }
}

export const dashboard = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [
      userCountRow,
      packageCountRow,
      requestCountRow,
      incomeRow,
      statusDistributionRows,
      monthlyTrendsRows,
      activeTripsCountRow,
      googleSignupCountRow,
      unverifiedUserCountRow,
      verifiedUserCountRow,
      packagesRows,
    ] = await Promise.all([
      safeQueryOne(`select count(*)::int as total from public.profiles`, [], { total: 0 }),
      safeQueryOne(`select count(*)::int as total from public.packages`, [], { total: 0 }),
      safeQueryOne(`select count(*)::int as total from public.shipment_requests`, [], { total: 0 }),
      safeQueryOne(`
        select coalesce(sum(insurance_cost), 0) as total_income
        from public.shipment_requests
        where status in ('accepted', 'intransit', 'delivering', 'completed')
      `, [], { total_income: 0 }),
      safeQuery(`
        select status as name, count(*)::int as count
        from public.shipment_requests
        group by status
      `, [], []),
      safeQuery(`
        select
          extract(year from created_at)::int as year,
          extract(month from created_at)::int as month,
          count(*)::int as count
        from public.packages
        where created_at >= $1
        group by 1, 2
        order by 1, 2
      `, [new Date(new Date().getFullYear() - 1, 0, 1)], []),
      safeQueryOne(`select count(*)::int as total from public.trips where status = 'active'`, [], { total: 0 }),
      safeQueryOne(`select count(*)::int as total from public.profiles where signup_method = 'google'`, [], { total: 0 }),
      safeQueryOne(`select count(*)::int as total from public.profiles where coalesce(kyc_status, 'pending') <> 'approved'`, [], { total: 0 }),
      safeQueryOne(`select count(*)::int as total from public.profiles where kyc_status = 'approved'`, [], { total: 0 }),
      safeQuery(`select * from public.packages order by created_at desc limit $1 offset $2`, [limit, skip], []),
    ]);

    const trackingData = packagesRows.map((pkg) => ({
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
      requests: [],
    }));

    const thisYear = new Date().getFullYear();
    const lastYear = thisYear - 1;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month) => ({ name: month, thisYear: 0, lastYear: 0 }));

    for (const trend of monthlyTrendsRows) {
      const monthIndex = Number(trend.month) - 1;
      if (monthIndex < 0 || monthIndex > 11) continue;
      if (Number(trend.year) === thisYear) monthlyData[monthIndex].thisYear = Number(trend.count || 0);
      if (Number(trend.year) === lastYear) monthlyData[monthIndex].lastYear = Number(trend.count || 0);
    }

    const totalRequests = statusDistributionRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
    const statusData = statusDistributionRows.map((row) => ({
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
