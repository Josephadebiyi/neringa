import { query, queryOne } from '../../lib/postgres/db.js';

export const getAllUsersKYC = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status && status !== 'all') {
      conditions.push(`kyc_status = $${idx++}`);
      values.push(status);
    }

    if (search) {
      conditions.push(`(first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR email ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const users = await query(
      `SELECT id, first_name as "firstName", last_name as "lastName", email,
              phone, country, date_of_birth as "dateOfBirth", image_url as "profileImage",
              kyc_status as "kycStatus", kyc_verified_at as "kycVerifiedAt",
              kyc_failure_reason as "kycFailureReason", identity_fingerprint as "identityFingerprint",
              didit_session_id as "diditSessionId", created_at as "createdAt", updated_at as "updatedAt"
       FROM public.profiles
       ${where}
       ORDER BY kyc_verified_at DESC NULLS LAST, created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, Number(limit), offset]
    );

    const countResult = await queryOne(
      `SELECT COUNT(*) FROM public.profiles ${where}`,
      values
    );
    const total = parseInt(countResult.count);

    return res.status(200).json({
      success: true,
      data: users.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching KYC data:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch KYC data', error: error.message });
  }
};

export const getUserKYCDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await queryOne(
      `SELECT id, first_name as "firstName", last_name as "lastName", email,
              phone, country, date_of_birth as "dateOfBirth",
              kyc_status as "kycStatus", kyc_verified_at as "kycVerifiedAt",
              kyc_failure_reason as "kycFailureReason",
              identity_fingerprint as "identityFingerprint",
              didit_session_id as "diditSessionId",
              status, email_verified as "emailVerified",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM public.profiles WHERE id = $1`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      data: {
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
        accountStatus: {
          accountStatus: user.status,
          emailVerified: user.emailVerified,
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
      },
    });
  } catch (error) {
    console.error('Error fetching user KYC details:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch user KYC details', error: error.message });
  }
};

export const getKYCStatistics = async (req, res) => {
  try {
    const [totalResult, byStatusResult, recentResult] = await Promise.all([
      queryOne(`SELECT COUNT(*) FROM public.profiles`),
      query(`SELECT kyc_status, COUNT(*) as count FROM public.profiles GROUP BY kyc_status`),
      queryOne(
        `SELECT COUNT(*) FROM public.profiles
         WHERE kyc_status = 'approved' AND kyc_verified_at >= NOW() - INTERVAL '30 days'`
      ),
    ]);

    const total = parseInt(totalResult.count);
    const byStatus = {};
    let verified = 0, pending = 0, declined = 0;

    byStatusResult.rows.forEach(({ kyc_status, count }) => {
      byStatus[kyc_status || 'unknown'] = parseInt(count);
      if (kyc_status === 'approved') verified = parseInt(count);
      else if (kyc_status === 'pending') pending = parseInt(count);
      else if (['declined', 'failed_verification', 'blocked_duplicate'].includes(kyc_status)) declined += parseInt(count);
    });

    return res.status(200).json({
      success: true,
      statistics: {
        total,
        verified,
        pending,
        declined,
        verificationRate: total > 0 ? ((verified / total) * 100).toFixed(2) : 0,
        recentVerifications30Days: parseInt(recentResult.count),
        byStatus,
      },
    });
  } catch (error) {
    console.error('Error fetching KYC statistics:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch KYC statistics', error: error.message });
  }
};

export const updateKYCStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['approved', 'declined', 'pending', 'not_started', 'failed_verification'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const fields = [`kyc_status = $1`, `updated_at = NOW()`];
    const values = [status];
    let idx = 2;

    if (status === 'approved') {
      fields.push(`kyc_verified_at = NOW()`);
      fields.push(`kyc_failure_reason = NULL`);
    } else if (status === 'declined' || status === 'failed_verification') {
      fields.push(`kyc_failure_reason = $${idx++}`);
      values.push(reason || 'Admin manual rejection');
    }

    values.push(userId);
    const user = await queryOne(
      `UPDATE public.profiles SET ${fields.join(', ')}
       WHERE id = $${idx} RETURNING id, email, kyc_status as "kycStatus"`,
      values
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: `KYC status updated to ${status}`,
      data: { userId: user.id, email: user.email, newStatus: user.kycStatus, reason: reason || null },
    });
  } catch (error) {
    console.error('Error updating KYC status:', error);
    return res.status(500).json({ success: false, message: 'Failed to update KYC status', error: error.message });
  }
};
