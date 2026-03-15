import mongoose from "mongoose";

const kycScheme = new mongoose.Schema(
  {
    userid: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    identityDocument: {
      type: String, // Cloudinary URL for ID image
      required: true,
    },
    proofOfAddress: {
      type: String, // Cloudinary URL for proof of address
      required: true,
    },
    verificationSelfie: {
      type: String, // Cloudinary URL for selfie
      required: true,
    },
    diditSessionId: {
      type: String, // Optional — for Didit verification
    },

    // ✅ Add these fields for tracking & debugging
    verificationNumber: {
      type: String,
      unique: true,
      default: () =>
        `KYC-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    },
    faceMatchScore: {
      type: Number,
      default: 0,
    },
    faceVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Kyc", kycScheme);
