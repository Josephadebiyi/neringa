import mongoose from 'mongoose';

const regionConfigSchema = new mongoose.Schema({
  fixedPrice: { type: Number, default: 6 },
  maxCoverageAmount: { type: Number, default: 5000 },
  commissionPercentage: { type: Number, default: 15 },
  currency: { type: String, default: 'USD' },
  enabled: { type: Boolean, default: true },
}, { _id: false });

const insuranceSettingSchema = new mongoose.Schema({
  // Global / Default settings
  global: regionConfigSchema,

  // Regional overrides
  africa: regionConfigSchema,
  europe: regionConfigSchema,

  // Enable/disable insurance feature globally
  enabled: {
    type: Boolean,
    default: true,
  },
  // Description and Terms
  description: { type: String, default: 'Protect your shipment against loss, damage, or theft during transit.' },
  terms: { type: String, default: 'Insurance coverage applies from pickup to delivery. Claims must be filed within 48 hours of delivery.' },
}, { timestamps: true });

export default mongoose.model('InsuranceSetting', insuranceSettingSchema);
