import { query, queryOne } from '../../lib/postgres/db.js';
import { markKycApproved } from '../../lib/postgres/accounts.js';
import { dojahReferenceFromPayload, syncDojahReferenceForUser } from '../DojahController.js';

function buildManualApprovalPayload(user = {}) {
  const submission = user.kycVerifiedData || {};
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return {
    provider: 'manual',
    reviewType: 'manual_document_upload',
    fullName: fullName || null,
    firstName: user.firstName || null,
    lastName: user.lastName || null,
    dateOfBirth: user.dateOfBirth || null,
    documentType: submission.idType || null,
    documentNumber: submission.idNumber || null,
    idFrontUrl: submission.idFrontUrl || null,
    idBackUrl: submission.idBackUrl || null,
    livenessUrl: submission.livenessUrl || null,
    submittedAt: submission.submittedAt || null,
    approvedAt: new Date().toISOString(),
    approvedBy: 'admin',
  };
}

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
              kyc_status as "kycStatus", kyc_provider as "kycProvider", kyc_verified_at as "kycVerifiedAt",
              kyc_failure_reason as "kycFailureReason", identity_fingerprint as "identityFingerprint",
              kyc_verified_data as "kycVerifiedData",
              verified_full_legal_name as "verifiedFullLegalName",
              verified_date_of_birth as "verifiedDateOfBirth",
              created_at as "createdAt", updated_at as "updatedAt"
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
              kyc_provider as "kycProvider",
              kyc_verified_data as "kycVerifiedData",
              verified_first_name as "verifiedFirstName",
              verified_middle_name as "verifiedMiddleName",
              verified_last_name as "verifiedLastName",
              verified_full_legal_name as "verifiedFullLegalName",
              verified_date_of_birth as "verifiedDateOfBirth",
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
          provider: user.kycProvider,
          verifiedAt: user.kycVerifiedAt,
          failureReason: user.kycFailureReason,
          manualSubmission: user.kycProvider === 'manual' ? user.kycVerifiedData : null,
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

    const validStatuses = ['approved', 'declined', 'pending', 'manual_review', 'not_started', 'failed_verification', 'blocked_duplicate'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (status === 'approved') {
      const existing = await queryOne(
        `SELECT id, email, first_name as "firstName", last_name as "lastName",
                date_of_birth as "dateOfBirth",
                kyc_status as "kycStatus", kyc_provider as "kycProvider",
                kyc_verified_data as "kycVerifiedData"
         FROM public.profiles
         WHERE id = $1`,
        [userId],
      );

      if (!existing) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const approvalPayload = buildManualApprovalPayload(existing);
      await markKycApproved(existing.id, {
        provider: existing.kycProvider || 'manual',
        firstName: existing.firstName || null,
        lastName: existing.lastName || null,
        dateOfBirth: existing.dateOfBirth || null,
        fullLegalName: approvalPayload.fullName,
        kycVerifiedData: approvalPayload,
      });

      return res.status(200).json({
        success: true,
        message: 'KYC approved by admin',
        data: { userId: existing.id, email: existing.email, newStatus: 'approved', reason: null },
      });
    }

    const fields = [`kyc_status = $1`, `updated_at = NOW()`];
    const values = [status];
    let idx = 2;

    if (status === 'declined' || status === 'failed_verification') {
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

function getStoredDojahReference(row = {}) {
  return dojahReferenceFromPayload(row.kycVerifiedData || {}) || row.referenceId || row.reference_id || '';
}

export const syncDojahKYCStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await queryOne(
      `SELECT id,
              kyc_status as "kycStatus",
              kyc_provider as "kycProvider",
              kyc_verified_data as "kycVerifiedData"
       FROM public.profiles
       WHERE id = $1`,
      [userId],
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const referenceId = getStoredDojahReference(user);
    const result = await syncDojahReferenceForUser(user.id, referenceId, { notify: true });

    return res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.success ? `Dojah status synced: ${result.status}` : result.message,
      data: { userId: user.id, ...result },
    });
  } catch (error) {
    console.error('Error syncing Dojah KYC status:', error);
    return res.status(500).json({ success: false, message: 'Failed to sync Dojah status', error: error.message });
  }
};

// POST /admin/kyc/users/:userId/sync-dojah-reference
// Admin provides a Dojah referenceId for a user stuck at NOT_STARTED (webhook miss or startSession failure)
export const syncDojahKYCByReference = async (req, res) => {
  try {
    const { userId } = req.params;
    const { referenceId } = req.body;

    if (!referenceId?.trim()) {
      return res.status(400).json({ success: false, message: 'referenceId is required' });
    }

    const ref = referenceId.trim();

    // Store the referenceId so the lookup will work, even if startDojahSession was never called
    await query(
      `UPDATE public.profiles
       SET kyc_provider = 'dojah',
           kyc_verified_data = COALESCE(kyc_verified_data, '{}'::jsonb) || jsonb_build_object(
             'provider', 'dojah',
             'referenceId', $2,
             'reference_id', $2,
             'patchedByAdmin', true,
             'patchedAt', timezone('utc', now())
           ),
           updated_at = NOW()
       WHERE id = $1 AND kyc_status NOT IN ('approved', 'blocked_duplicate')`,
      [userId, ref],
    );

    const result = await syncDojahReferenceForUser(userId, ref, { notify: true });

    return res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.success
        ? `Dojah sync complete: ${result.status} (was NOT_STARTED)`
        : result.message,
      data: { userId, referenceId: ref, ...result },
    });
  } catch (error) {
    console.error('syncDojahKYCByReference error:', error);
    return res.status(500).json({ success: false, message: 'Failed to sync by reference', error: error.message });
  }
};

export const syncUnverifiedDojahKYCStatuses = async (_req, res) => {
  try {
    const users = await query(
      `SELECT id,
              email,
              kyc_status as "kycStatus",
              kyc_provider as "kycProvider",
              kyc_verified_data as "kycVerifiedData"
       FROM public.profiles
       WHERE kyc_provider = 'dojah'
         AND COALESCE(kyc_status, 'not_started') NOT IN ('approved', 'blocked_duplicate')
         AND kyc_verified_data IS NOT NULL
       ORDER BY updated_at DESC
       LIMIT 100`,
    );

    const results = [];
    for (const user of users.rows) {
      const referenceId = getStoredDojahReference(user);
      if (!referenceId) {
        results.push({
          userId: user.id,
          email: user.email,
          success: false,
          status: 'missing_reference',
        });
        continue;
      }
      const result = await syncDojahReferenceForUser(user.id, referenceId, { notify: true });
      results.push({ userId: user.id, email: user.email, ...result });
    }

    const summary = results.reduce((acc, item) => {
      const key = item.status || (item.success ? 'synced' : 'failed');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      message: `Synced ${results.length} Dojah KYC records`,
      data: { summary, results },
    });
  } catch (error) {
    console.error('Error syncing unverified Dojah KYC statuses:', error);
    return res.status(500).json({ success: false, message: 'Failed to sync Dojah statuses', error: error.message });
  }
};
