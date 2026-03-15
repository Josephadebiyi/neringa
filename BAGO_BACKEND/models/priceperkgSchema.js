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

    // Base price for any shipment on this route
    basePrice: {
      type: Number,
      required: true,
      default: 10,
      min: 0,
    },

    // Price per kilogram (Weight Multiplier)
    weightMultiplier: {
      type: Number,
      required: true,
      default: 5,
      min: 0,
    },

    // Price per cm³ or similar dimension factor (Dimension Multiplier)
    dimensionMultiplier: {
      type: Number,
      required: true,
      default: 0.1,
      min: 0,
    },

    // Currency
    currency: {
      type: String,
      default: "USD",
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
