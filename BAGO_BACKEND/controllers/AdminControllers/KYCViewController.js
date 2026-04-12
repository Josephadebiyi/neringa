import { query, queryOne } from '../../lib/postgres/db.js';

function normalizeKycUser(row) {
  return {
    _id: row.id,
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    country: row.country,
    dateOfBirth: row.date_of_birth,
    profileImage: row.image_url,
    kycStatus: row.kyc_status,
    kycVerifiedAt: row.kyc_verified_at,
    kycVerifiedData: row.kyc_verified_data,
    identityFingerprint: row.identity_fingerprint,
    kycFailureReason: row.kyc_failure_reason,
    diditSessionId: row.didit_session_id,
    status: row.status,
    isVerified: row.email_verified,
    stripeVerified: row.stripe_verified,
    stripeConnectAccountId: row.stripe_connect_account_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const getAllUsersKYC = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (numericPage - 1) * numericLimit;

    const conditions = [];
    const params = [];
    let index = 1;

    if (status && status !== 'all') {
      conditions.push(`p.kyc_status = $${index++}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(
        lower(coalesce(p.first_name, '')) like lower($${index})
        or lower(coalesce(p.last_name, '')) like lower($${index})
        or lower(p.email) like lower($${index})
      )`);
      params.push(`%${search}%`);
      index += 1;
    }

    const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : '';

    const usersResult = await query(
      `
        select
          p.id,
          p.first_name,
          p.last_name,
          p.email,
          p.phone,
          p.country,
          p.date_of_birth,
          p.image_url,
          p.kyc_status,
          p.kyc_verified_at,
          p.kyc_verified_data,
          p.identity_fingerprint,
          p.kyc_failure_reason,
          p.created_at
        from public.profiles p
        ${whereClause}
        order by p.kyc_verified_at desc nulls last, p.created_at desc
        limit $${index} offset $${index + 1}
      `,
      [...params, numericLimit, offset],
    );

    const totalRow = await queryOne(
      `select count(*)::int as total from public.profiles p ${whereClause}`,
      params,
    );

    return res.status(200).json({
      success: true,
      data: usersResult.rows.map(normalizeKycUser),
      pagination: {
        page: numericPage,
        limit: numericLimit,
        total: totalRow?.total || 0,
        pages: Math.ceil((totalRow?.total || 0) / numericLimit),
      },
    });
  } catch (error) {
    console.error('Error fetching KYC data:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC data',
      error: error.message,
    });
  }
};

export const getUserKYCDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const row = await queryOne(`select * from public.profiles where id = $1`, [userId]);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = normalizeKycUser(row);

    const kycDetails = {
      userId: user.id,
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
            documentNumber: user.kycVerifiedData.documentNumber,
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
          ? `${String(user.identityFingerprint).substring(0, 16)}...`
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
    console.error('Error fetching user KYC details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user KYC details',
      error: error.message,
    });
  }
};

export const getKYCStatistics = async (req, res) => {
  try {
    const [statusRows, totals] = await Promise.all([
      query(`
        select coalesce(kyc_status, 'unknown') as status, count(*)::int as count
        from public.profiles
        group by coalesce(kyc_status, 'unknown')
      `),
      queryOne(`
        select
          count(*)::int as total,
          count(*) filter (where kyc_status = 'approved')::int as verified,
          count(*) filter (where kyc_status = 'pending')::int as pending,
          count(*) filter (
            where kyc_status in ('declined', 'failed_verification', 'blocked_duplicate')
          )::int as declined,
          count(*) filter (
            where kyc_status = 'approved'
              and kyc_verified_at >= timezone('utc', now()) - interval '30 days'
          )::int as recent_verifications
        from public.profiles
      `),
    ]);

    return res.status(200).json({
      success: true,
      statistics: {
        total: totals?.total || 0,
        verified: totals?.verified || 0,
        pending: totals?.pending || 0,
        declined: totals?.declined || 0,
        verificationRate: (totals?.total || 0) > 0 ? (((totals?.verified || 0) / totals.total) * 100).toFixed(2) : 0,
        recentVerifications30Days: totals?.recent_verifications || 0,
        byStatus: statusRows.rows.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error fetching KYC statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch KYC statistics',
      error: error.message,
    });
  }
};

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

    const previous = await queryOne(`select id, email, kyc_status from public.profiles where id = $1`, [userId]);
    if (!previous) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const nextStatus = status === 'approved' ? 'verified' : status === 'declined' ? 'rejected' : previous.status;
    await query(
      `
        update public.profiles
        set
          kyc_status = $2,
          kyc_verified_at = case when $2 = 'approved' then timezone('utc', now()) else kyc_verified_at end,
          kyc_failure_reason = case
            when $2 = 'declined' then $3
            when $2 = 'pending' then null
            when $2 = 'approved' then null
            else kyc_failure_reason
          end,
          status = case
            when $2 = 'approved' then 'verified'
            when $2 = 'declined' then 'rejected'
            else status
          end,
          email_verified = case
            when $2 = 'approved' then true
            when $2 = 'declined' then false
            else email_verified
          end,
          updated_at = timezone('utc', now())
        where id = $1
      `,
      [userId, status, reason || 'Admin manual rejection', nextStatus],
    );

    return res.status(200).json({
      success: true,
      message: `KYC status updated to ${status}`,
      data: {
        userId,
        email: previous.email,
        previousStatus: previous.kyc_status,
        newStatus: status,
        reason: reason || null,
      },
    });
  } catch (error) {
    console.error('Error updating KYC status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update KYC status',
      error: error.message,
    });
  }
};
