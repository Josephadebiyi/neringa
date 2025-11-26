import mongoose from "mongoose";

const refundSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  paymentIntentId: { type: String, required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ["pending", "approved", "refunded", "rejected"],
    default: "pending"
  },
  refundId: { type: String },
}, { timestamps: true });

export default mongoose.model("Refund", refundSchema);
