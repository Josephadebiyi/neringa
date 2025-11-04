import mongoose from "mongoose";

const pricePerKgSchema = new mongoose.Schema(
  {
    // Origin location (e.g., "Lagos")
    from: {
      type: String,
      required: true,
      trim: true,
    },

    // Destination location (e.g., "Abuja")
    to: {
      type: String,
      required: true,
      trim: true,
    },

    // Category or item type (optional)
    category: {
      type: String,
      trim: true,
    },

    // Price per kilogram
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },

    // Currency
    currency: {
      type: String,
      default: "NGN",
      enum: ["NGN", "USD", "EUR", "GBP"],
    },

    // Minimum chargeable weight
    minWeightKg: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional discount for higher weight
    discountRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PricePerKg ||
  mongoose.model("PricePerKg", pricePerKgSchema);
