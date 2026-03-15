import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "refunded", "rejected"],
    default: "pending"
  },
  refundId: { type: String },
  // 🆕 Payment info
  paymentInfo: {
    method: {
      type: String,
      enum: ["stripe", "paystack", null],
      default: null,
    },
    status: {
      type: String,
      enum: ["paid", "failed", null],
      default: null,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },
  },
}, { timestamps: true });

export default mongoose.model("Refund", refundSchema);
