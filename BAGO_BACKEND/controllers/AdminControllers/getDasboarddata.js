import { query, queryOne } from '../../lib/postgres/db.js';

export const dashboard = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const [
      userCount,
      packageCount,
      requestCount,
      activeTripsCount,
      googleCount,
      unverifiedCount,
      verifiedCount,
      incomeResult,
      statusDist,
      monthlyTrends,
      packages,
    ] = await Promise.all([
      queryOne(`SELECT COUNT(*) FROM public.profiles`),
      queryOne(`SELECT COUNT(*) FROM public.packages`),
      queryOne(`SELECT COUNT(*) FROM public.shipment_requests`),
      queryOne(`SELECT COUNT(*) FROM public.trips WHERE status IN ('active','verified')`),
      queryOne(`SELECT COUNT(*) FROM public.profiles WHERE signup_method = 'google'`),
      queryOne(`SELECT COUNT(*) FROM public.profiles WHERE kyc_status != 'approved'`),
      queryOne(`SELECT COUNT(*) FROM public.profiles WHERE kyc_status = 'approved'`),
      queryOne(`SELECT COALESCE(SUM((payment_info->>'amount')::numeric), 0) as total FROM public.shipment_requests WHERE status = 'completed'`),
      query(`SELECT status as name, COUNT(*) as count FROM public.shipment_requests GROUP BY status`),
      query(`
        SELECT EXTRACT(YEAR FROM created_at)::int as year,
               EXTRACT(MONTH FROM created_at)::int as month,
               COUNT(*) as count
        FROM public.packages
        WHERE created_at >= date_trunc('year', NOW() - INTERVAL '1 year')
        GROUP BY year, month ORDER BY year, month
      `),
      query(`SELECT * FROM public.packages ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [Number(limit), offset]),
    ]);

    // Build tracking data with requests per package
    const trackingData = await Promise.all(
      packages.rows.map(async (pkg) => {
        const requests = await query(
          `SELECT id, sender_id, traveler_id, status, created_at FROM public.shipment_requests WHERE package_id = $1`,
          [pkg.id]
        );
        return { package: pkg, requests: requests.rows };
      })
    );

    // Monthly trends
    const thisYear = new Date().getFullYear();
    const lastYear = thisYear - 1;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyData = months.map((name) => ({ name, thisYear: 0, lastYear: 0 }));
    monthlyTrends.rows.forEach(({ year, month, count }) => {
      const idx = month - 1;
      if (year === thisYear) monthlyData[idx].thisYear = parseInt(count);
      else if (year === lastYear) monthlyData[idx].lastYear = parseInt(count);
    });

    const totalIncome = parseFloat(incomeResult?.total || 0);
    const totalRequests = statusDist.rows.reduce((s, r) => s + parseInt(r.count), 0);
    const statusData = statusDist.rows.map((r) => ({
      name: r.name,
      value: totalRequests > 0 ? (parseInt(r.count) / totalRequests) * 100 : 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers: parseInt(userCount.count),
          totalPackages: parseInt(packageCount.count),
          totalRequests: parseInt(requestCount.count),
          totalIncome,
          totalCommission: totalIncome * 0.1,
          activeTrips: parseInt(activeTripsCount.count),
          googleUsers: parseInt(googleCount.count),
          unverifiedUsers: parseInt(unverifiedCount.count),
          verifiedUsers: parseInt(verifiedCount.count),
        },
        trackingData,
        statusDistribution: statusData,
        monthlyTrends: monthlyData,
        pagination: {
          totalCount: parseInt(packageCount.count),
          page: Number(page),
          limit: Number(limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
