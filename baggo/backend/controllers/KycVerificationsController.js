import fetch from "node-fetch";
import FormData from "form-data";
import Kyc from "../models/kycScheme.js";
import Setting from "../models/settingSheme.js";
import User from "../models/userScheme.js";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";

// ✅ Verify KYC status manually or auto
export const Verifykyc = async (req, res, next) => {
  const { userId, status } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (status === "verify") {
      user.isVerified = true;
      user.status = "verified";
    } else if (status === "auto") {
      user.isVerified = false;
      user.status = "pending";
    }

    await user.save();
    res.status(200).json({ message: "User verification status updated" });
  } catch (error) {
    next(error);
  }
};

import axios from 'axios';
import Kyc from "../models/kycScheme.js";
import User from "../models/userScheme.js";
import dotenv from 'dotenv';
dotenv.config();

const DIDIT_API_KEY = process.env.DIDIT_API_KEY || 'W9Z65OUcc-JjmtqR10AXNKFg1LMj6L1ohVyi-YGSAHk';
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
    const vendorData = JSON.stringify({ userId: user._id.toString(), email: user.email });

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

    console.log("📝 Sending request to DIDIT for user:", user._id);
    const response = await axios.post('https://verification.didit.me/v3/session/', payload, config);

    if (response.data && response.data.session_id) {
      await User.findByIdAndUpdate(user._id, {
        diditSessionId: response.data.session_id,
        diditSessionToken: response.data.session_token,
        kycStatus: 'pending'
      });

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

      // Also overwrite main profile fields as requested
      if (fullName) {
        const parts = fullName.split(' ');
        if (parts.length >= 2) {
          updateData.firstName = parts[0];
          updateData.lastName = parts.slice(1).join(' ');
        } else {
          updateData.firstName = fullName;
        }
      }
      if (dob) updateData.dateOfBirth = new Date(dob);

      await User.findByIdAndUpdate(user._id, updateData);

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




// ✅ Get user KYC
export const getKyc = async (req, res, next) => {
  try {
    const userid = req.user._id;
    const kyc = await Kyc.findOne({ userid });
    if (!kyc) return res.status(404).json({ message: "KYC not found" });

    const finduser = await User.findById(userid).select("-password -__v -createdAt -updatedAt");
    return res.status(200).json({
      status: "success",
      error: false,
      data: { finduser, kyc },
    });
  } catch (error) {
    next(error);
  }
};

// ✅ Get all KYC records
export const getAllkyc = async (req, res, next) => {
  try {
    const kycs = await Kyc.find();
    if (!kycs || kycs.length === 0)
      return res.status(404).json({ message: "No KYC records found" });

    const userIds = kycs.map(k => k.userid);
    const users = await User.find({ _id: { $in: userIds } }).select(
      "-password -__v -createdAt -updatedAt"
    );

    res.status(200).json({
      message: "Successful",
      data: { users, kycs },
      success: true,
      error: false,
    });
  } catch (error) {
    next(error);
  }
};
