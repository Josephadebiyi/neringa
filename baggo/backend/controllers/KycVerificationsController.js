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

// ✅ Main KYC Verification with Face++ (ID + Selfie match)
// ✅ Main KYC Verification with Face++ (ID + Selfie match)
export const KycVerifications = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id)
      return res.status(401).json({ message: "User not authenticated" });

    const userid = req.user._id;
    const { identityDocument, proofOfAddress, verificationSelfie } = req.body;

    // Validate fields
    if (!identityDocument || !proofOfAddress || !verificationSelfie)
      return res.status(400).json({ message: "All image fields are required" });

      // ✅ Check if this user already submitted KYC
    const existingUserKyc = await Kyc.findOne({ userid });
    if (existingUserKyc) {
      return res.status(400).json({
        message: "You already submitted KYC. Please wait for review.",
      });
    }

    // ✅ Prevent reusing the same ID or selfie across different accounts
    const duplicateKyc = await Kyc.findOne({
      $or: [
        { identityDocument: identityDocument },
        { verificationSelfie: verificationSelfie },
      ],
    });

    // If found, and the existing record belongs to another user → block it
    if (duplicateKyc && duplicateKyc.userid.toString() !== userid.toString()) {
      return res.status(400).json({
        message:
          "This ID document or selfie has already been used on another account. Please upload a unique document.",
      });
    }

    // ✅ Upload all images to Cloudinary
    let idUpload, proofUpload, selfieUpload;
    try {
      [idUpload, proofUpload, selfieUpload] = await Promise.all([
        cloudinary.v2.uploader.upload(identityDocument, { resource_type: "image" }),
        cloudinary.v2.uploader.upload(proofOfAddress, { resource_type: "image" }),
        cloudinary.v2.uploader.upload(verificationSelfie, { resource_type: "image" }),
      ]);
    } catch (uploadError) {
      return res.status(500).json({ message: "Image upload failed. Please try again.", error: uploadError.message });
    }

    // ✅ Save preliminary KYC record
    const newKyc = new Kyc({
      userid,
      identityDocument: idUpload.secure_url,
      proofOfAddress: proofUpload.secure_url,
      verificationSelfie: selfieUpload.secure_url,
    });
    await newKyc.save();

    // ✅ Face++ Compare API
    const apiKey = "yvg7MVe6IPFMUkLaLXM4Zq9i19WqgMch";
    const apiSecret = "0NPMWdGi2Jjxa1MhqoOS0t4tTRepCsV_";

    const compareUrl = "https://api-us.faceplusplus.com/facepp/v3/compare";
    const compareBody = new URLSearchParams({
      api_key: apiKey,
      api_secret: apiSecret,
      image_url1: idUpload.secure_url,
      image_url2: selfieUpload.secure_url,
    });

    const compareResponse = await fetch(compareUrl, {
      method: "POST",
      body: compareBody,
    });

    const compareData = await compareResponse.json();

    // ✅ Handle Face++ specific errors
    if (compareData.error_message) {
      return res.status(400).json({
        message: `Face verification failed: ${compareData.error_message}`,
      });
    }

    if (!compareData.confidence) {
      return res.status(400).json({
        message: "No faces detected. Please re-upload clearer photos.",
      });
    }

    // ✅ Determine verification success
    let verified = compareData.confidence >= 75;

    // ✅ Update user verification status
    const user = await User.findById(userid);
    const setting = await Setting.findOne({});
    const autoVerify = setting?.autoVerification || false;

    if (verified) {
      user.isVerified = true;
      user.status = "verified";
      await user.save();

      newKyc.faceMatchScore = compareData.confidence || 0;
      newKyc.faceVerified = true;
      await newKyc.save();

      return res.status(201).json({
        message: "KYC verified successfully through Face++!",
        confidence: compareData.confidence,
      });
    } else {
      user.status = "pending";
      await user.save();

      newKyc.faceMatchScore = compareData.confidence || 0;
      newKyc.faceVerified = false;
      await newKyc.save();

      return res.status(400).json({
        message: "Face does not match ID. Please re-upload clearer photos.",
        confidence: compareData.confidence,
      });
    }

  } catch (error) {
    console.error("KycVerifications error:", error.message);

    // ✅ Handle MongoDB duplicate errors clearly
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Duplicate KYC detected. This user has already submitted verification.",
        error: error.message,
      });
    }

    return res.status(500).json({
      message: "An unexpected error occurred during KYC verification.",
      error: error.message,
    });
  }
};



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
