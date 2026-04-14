import fetch from "node-fetch";
import FormData from "form-data";
import axios from 'axios';
import { query, queryOne } from "../lib/postgres/db.js";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
dotenv.config();

// ✅ Verify KYC status manually (admin)
export const Verifykyc = async (req, res, next) => {
  const { userId, status } = req.body;

  try {
    const fields = [];
    const values = [];
    let idx = 1;

    if (status === "verify") {
      fields.push(`kyc_status = $${idx++}`); values.push('approved');
      fields.push(`kyc_verified_at = NOW()`);
      fields.push(`kyc_failure_reason = NULL`);
    } else if (status === "approved") {
      fields.push(`kyc_status = $${idx++}`); values.push('approved');
      fields.push(`kyc_verified_at = NOW()`);
      fields.push(`kyc_failure_reason = NULL`);
    } else if (status === "declined") {
      fields.push(`kyc_status = $${idx++}`); values.push('declined');
    } else if (status === "auto" || status === "pending") {
      fields.push(`kyc_status = $${idx++}`); values.push('pending');
    } else {
      fields.push(`kyc_status = $${idx++}`); values.push(status);
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


const DIDIT_API_KEY = process.env.DIDIT_API_KEY;
const DIDIT_WORKFLOW_ID = '701347c6-bd51-4ab7-8a35-8a442db4b63c';

// ✅ Generate DIDIT Session for the user (The fix for "Could not start")
export const createDiditSession = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ success: false, message: "User not authenticated" });

    // Reuse existing approved state
    if (user.kycStatus === 'approved') {
      return res.status(200).json({
        success: true,
        message: "KYC already approved",
        status: 'approved'
      });
    }

    // Build the request URL and payload. 
    // FIXED: Use correct endpoint and ensure headers match DIDIT requirements
    const userId = user.id || user._id;
    const vendorData = JSON.stringify({ userId: userId.toString(), email: user.email });

    const config = {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': DIDIT_API_KEY,
      }
    };

    const payload = {
      workflow_id: DIDIT_WORKFLOW_ID,
      vendor_data: vendorData,
      callback: `${process.env.BASE_URL || 'https://neringa.onrender.com'}/api/didit/webhook`,
    };

    console.log("📝 Sending request to DIDIT for user:", userId);
    const response = await axios.post('https://verification.didit.me/v3/session/', payload, config);

    if (response.data && response.data.session_id) {
      await queryOne(
        `UPDATE public.profiles SET didit_session_id = $1, kyc_status = 'pending', updated_at = NOW() WHERE id = $2`,
        [response.data.session_id, userId]
      );

      return res.json({
        success: true,
        sessionId: response.data.session_id,
        sessionToken: response.data.session_token,
        sessionUrl: response.data.url,
        message: "Verification session created"
      });
    } else {
      throw new Error(response.data.message || "DIDIT initialization failed");
    }
  } catch (err) {
    console.error("❌ DIDIT Create Session Error:", err.response?.data || err.message);
    res.status(500).json({
      success: false,
      message: err.response?.data?.detail || "Failed to create KYC session",
      error: err.response?.data || err.message
    });
  }
};

// Handle Fetching Result after verification success
export const fetchDiditResult = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const user = req.user;

    const response = await axios.get(`https://verification.didit.me/v3/session/${sessionId}/`, {
      headers: {
        'accept': 'application/json',
        'x-api-key': DIDIT_API_KEY,
      }
    });

    const data = response.data;
    console.log("📥 DIDIT Result data:", data);

    if (data.status === 'approved') {
      const extracted = data.extracted_data || data.document_data || {};
      const fullName = extracted.full_name || extracted.fullName || `${extracted.first_name || ''} ${extracted.last_name || ''}`.trim();
      const dob = extracted.date_of_birth || extracted.dateOfBirth;

      // Automatically store in user profile
      const updateData = {
        kycStatus: 'approved',
        status: 'verified',
        isVerified: true,
        kycVerifiedAt: new Date(),
        kycVerifiedData: {
          fullName,
          dateOfBirth: dob ? new Date(dob) : null,
          documentNumber: extracted.document_number,
          issuingCountry: extracted.issuing_country,
          verificationStatus: 'approved'
        }
      };

      const userId = user.id || user._id;
      const setParts = [
        `kyc_status = 'approved'`,
        `kyc_verified_at = NOW()`,
        `kyc_failure_reason = NULL`,
        `kyc_verified_data = $1`,
        `updated_at = NOW()`,
      ];
      const pgValues = [JSON.stringify({
        fullName,
        dateOfBirth: dob || null,
        documentNumber: extracted.document_number,
        issuingCountry: extracted.issuing_country,
        verificationStatus: 'approved'
      })];
      let pidx = 2;

      if (fullName) {
        const parts = fullName.split(' ');
        setParts.push(`first_name = $${pidx++}`); pgValues.push(parts[0]);
        if (parts.length >= 2) { setParts.push(`last_name = $${pidx++}`); pgValues.push(parts.slice(1).join(' ')); }
      }
      if (dob) { setParts.push(`date_of_birth = $${pidx++}`); pgValues.push(new Date(dob)); }

      pgValues.push(userId);
      await queryOne(
        `UPDATE public.profiles SET ${setParts.join(', ')} WHERE id = $${pidx}`,
        pgValues
      );

      return res.json({
        success: true,
        message: "KYC approved and profile updated",
        fullName,
        dateOfBirth: dob,
        kycStatus: 'approved'
      });
    }

    res.json({
      success: false,
      message: "KYC is not yet approved",
      status: data.status
    });
  } catch (err) {
    console.error("❌ Fetch DIDIT Result Error:", err.response?.data || err.message);
    res.status(500).json({ success: false, message: "Error fetching KYC result" });
  }
};

// Replaced previous Face++ KycVerifications with a placeholder if needed
export const KycVerifications = createDiditSession;




// ✅ Get user KYC (for logged-in user)
export const getKyc = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await queryOne(
      `SELECT id, email, first_name as "firstName", last_name as "lastName",
              kyc_status as "kycStatus", kyc_verified_at as "kycVerifiedAt",
              kyc_failure_reason as "kycFailureReason", didit_session_id as "diditSessionId",
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
      `SELECT id, email, first_name as "firstName", last_name as "lastName",
              phone, image_url as "profileImage", country,
              kyc_status as "kycStatus", kyc_verified_at as "kycVerifiedAt",
              kyc_failure_reason as "kycFailureReason",
              didit_session_id as "diditSessionId",
              identity_fingerprint as "identityFingerprint",
              kyc_verified_data as "kycVerifiedData",
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
