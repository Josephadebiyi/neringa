import { query, queryOne } from "../lib/postgres/db.js";
import dotenv from 'dotenv';
import { markKycApproved } from "../lib/postgres/accounts.js";
dotenv.config();

function buildManualApprovalPayload(profile = {}) {
  const submission = profile.kycVerifiedData || {};
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  return {
    provider: 'manual',
    reviewType: 'manual_document_upload',
    fullName: fullName || null,
    firstName: profile.firstName || null,
    lastName: profile.lastName || null,
    dateOfBirth: profile.dateOfBirth || null,
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

// Admin may approve only manual-review uploads. Dojah approvals remain webhook-owned.
export const Verifykyc = async (req, res, next) => {
  const { userId, status, reason } = req.body;

  try {
    if (status === "verify" || status === "approved") {
      const profile = await queryOne(
        `SELECT id, email, first_name as "firstName", last_name as "lastName",
                date_of_birth as "dateOfBirth",
                kyc_status as "kycStatus", kyc_provider as "kycProvider",
                kyc_verified_data as "kycVerifiedData"
         FROM public.profiles
         WHERE id = $1`,
        [userId],
      );

      if (!profile) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (profile.kycProvider !== 'manual' || profile.kycStatus !== 'manual_review') {
        return res.status(403).json({
          success: false,
          message: "Manual approval is only available for manual-upload KYC submissions.",
        });
      }

      const approvalPayload = buildManualApprovalPayload(profile);
      await markKycApproved(profile.id, {
        provider: 'manual',
        firstName: profile.firstName || null,
        lastName: profile.lastName || null,
        dateOfBirth: profile.dateOfBirth || null,
        fullLegalName: approvalPayload.fullName,
        kycVerifiedData: approvalPayload,
      });

      const approvedUser = await queryOne(
        `SELECT id, email, kyc_status as "kycStatus", status
         FROM public.profiles
         WHERE id = $1`,
        [profile.id],
      );

      return res.status(200).json({
        success: true,
        message: "Manual KYC approved",
        data: approvedUser,
      });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (status === "declined") {
      fields.push(`kyc_status = $${idx++}`); values.push('declined');
      fields.push(`kyc_failure_reason = $${idx++}`); values.push(reason || 'Admin manual rejection');
    } else if (status === "pending") {
      fields.push(`kyc_status = $${idx++}`); values.push('pending');
    } else {
      return res.status(400).json({ success: false, message: "Invalid status. Only 'declined' is allowed." });
    }

    values.push(userId);
    const user = await queryOne(
      `UPDATE public.profiles SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING id, email, kyc_status as "kycStatus"`,
      values
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, message: "User verification status updated", data: user });
  } catch (error) {
    next(error);
  }
};


export const KycVerifications = async (_req, res) => {
  return res.status(410).json({
    success: false,
    message: 'This KYC route has been retired. Use Dojah KYC or manual document upload.',
  });
};




// ✅ Get user KYC (for logged-in user)
export const getKyc = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await queryOne(
      `SELECT id, id as "_id", email, first_name as "firstName", last_name as "lastName",
              kyc_status as "kycStatus", kyc_verified_at as "kycVerifiedAt",
              kyc_failure_reason as "kycFailureReason",
              identity_fingerprint as "identityFingerprint", kyc_verified_data as "kycVerifiedData"
       FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      status: "success",
      error: false,
      data: { finduser: user, kyc: user },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get all KYC records (admin)
export const getAllkyc = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const result = await query(
      `SELECT id, id as "_id", email, first_name as "firstName", last_name as "lastName",
              phone, image_url as "profileImage", country,
              date_of_birth as "dateOfBirth",
              kyc_status as "kycStatus", kyc_provider as "kycProvider",
              kyc_verified_at as "kycVerifiedAt",
              kyc_failure_reason as "kycFailureReason",
              identity_fingerprint as "identityFingerprint",
              kyc_verified_data as "kycVerifiedData",
              verified_first_name as "verifiedFirstName",
              verified_last_name as "verifiedLastName",
              verified_full_legal_name as "verifiedFullLegalName",
              verified_date_of_birth as "verifiedDateOfBirth",
              created_at as "createdAt"
       FROM public.profiles
       ORDER BY kyc_verified_at DESC NULLS LAST, created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );

    const countRow = await queryOne(`SELECT COUNT(*) FROM public.profiles`);

    res.status(200).json({
      message: "Successful",
      data: { users: result.rows, kycs: result.rows },
      success: true,
      error: false,
      totalCount: parseInt(countRow.count),
    });
  } catch (error) {
    next(error);
  }
};
