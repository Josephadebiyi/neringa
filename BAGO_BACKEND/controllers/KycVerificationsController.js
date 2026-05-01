import fetch from "node-fetch";
import FormData from "form-data";
import axios from 'axios';
import { query, queryOne } from "../lib/postgres/db.js";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";
import dotenv from 'dotenv';
import { markKycApproved } from "../lib/postgres/accounts.js";
dotenv.config();

async function fetchDiditSessionStatus(sessionId) {
  if (!sessionId) {
    throw new Error('No DIDIT session ID found for this user');
  }
  if (!DIDIT_API_KEY) {
    throw new Error('DIDIT_API_KEY is not configured');
  }

  const response = await fetch(`https://verification.didit.me/v3/session/${sessionId}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': DIDIT_API_KEY,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Didit session lookup failed (${response.status}): ${body || response.statusText}`);
  }

  return response.json();
}

// Admin can only decline KYC — approvals come exclusively from DIDIT webhook
export const Verifykyc = async (req, res, next) => {
  const { userId, status } = req.body;

  try {
    if (status === 'sync' || status === 'resync') {
      const profile = await queryOne(
        `SELECT id, email, didit_session_id as "diditSessionId", kyc_status as "kycStatus"
         FROM public.profiles
         WHERE id = $1`,
        [userId],
      );

      if (!profile) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const diditData = await fetchDiditSessionStatus(profile.diditSessionId);
      const diditStatus = String(diditData?.status || '').toLowerCase();

      if (diditStatus === 'approved') {
        await markKycApproved(profile.id, {
          kycVerifiedData: diditData,
        });

        const syncedUser = await queryOne(
          `SELECT id, email, kyc_status as "kycStatus", status
           FROM public.profiles
           WHERE id = $1`,
          [profile.id],
        );

        return res.status(200).json({
          success: true,
          message: "KYC synced from Didit and approved",
          diditStatus,
          data: syncedUser,
        });
      }

      if (diditStatus === 'declined' || diditStatus === 'rejected') {
        await query(
          `
            UPDATE public.profiles
            SET kyc_status = 'declined',
                kyc_failure_reason = 'Document verification was declined by the verification provider',
                updated_at = NOW()
            WHERE id = $1
          `,
          [profile.id],
        );

        await query(
          `
            UPDATE public.kyc_verifications
            SET status = 'declined',
                review_notes = 'Declined via Didit sync',
                updated_at = timezone('utc', now())
            WHERE user_id = $1
          `,
          [profile.id],
        );

        return res.status(200).json({
          success: true,
          message: "KYC synced from Didit and remains declined",
          diditStatus,
          data: { id: profile.id, email: profile.email, kycStatus: 'declined' },
        });
      }

      return res.status(409).json({
        success: false,
        message: `Didit session is still ${diditStatus || 'pending'}. No approval was applied.`,
        diditStatus: diditStatus || 'pending',
      });
    }

    if (status === "verify" || status === "approved") {
      return res.status(403).json({
        success: false,
        message: "Manual KYC approval is disabled. Use sync/resync to confirm the latest Didit decision.",
      });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (status === "declined") {
      fields.push(`kyc_status = $${idx++}`); values.push('declined');
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

// Poll KYC status from local DB — webhook keeps this up to date so no DIDIT API call needed
export const fetchDiditResult = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    let row = await queryOne(
      `SELECT kyc_status as "kycStatus", kyc_verified_at as "kycVerifiedAt", kyc_failure_reason as "kycFailureReason",
              didit_session_id as "diditSessionId"
       FROM public.profiles WHERE id = $1`,
      [userId]
    );
    if (!row) return res.status(404).json({ success: false, message: "User not found" });

    let status = row.kycStatus || 'pending';

    if (status === 'pending' && row.diditSessionId) {
      try {
        const diditData = await fetchDiditSessionStatus(row.diditSessionId);
        const diditStatus = String(diditData?.status || '').toLowerCase();

        if (diditStatus === 'approved') {
          await markKycApproved(userId, { kycVerifiedData: diditData });
          status = 'approved';
          row = { ...row, kycStatus: status, kycVerifiedAt: new Date() };
        } else if (diditStatus === 'declined' || diditStatus === 'rejected') {
          await query(
            `UPDATE public.profiles
             SET kyc_status = 'declined',
                 kyc_failure_reason = 'Document verification was declined by the verification provider',
                 updated_at = NOW()
             WHERE id = $1`,
            [userId],
          );
          status = 'declined';
        }
      } catch (diditErr) {
        console.warn('Could not sync DIDIT status:', diditErr.message);
      }
    }

    return res.json({
      success: status === 'approved',
      status,
      kycStatus: status,
      kycVerifiedAt: row.kycVerifiedAt || null,
      phoneVerified: req.user?.phoneVerified === true,
      message: status === 'approved'
        ? 'KYC approved'
        : status === 'declined'
          ? 'KYC declined'
          : 'Verification in progress',
    });
  } catch (err) {
    console.error("❌ fetchDiditResult Error:", err.message);
    res.status(500).json({ success: false, message: "Error fetching KYC status" });
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
