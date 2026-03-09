import mongoose from 'mongoose';

const insuranceSettingSchema = new mongoose.Schema({
  // Insurance pricing configuration
  baseRate: {
    type: Number,
    default: 5, // Base rate in USD
    min: [0, 'Base rate cannot be negative'],
  },
  percentageOfValue: {
    type: Number,
    default: 2, // 2% of item value
    min: [0, 'Percentage cannot be negative'],
    max: [100, 'Percentage cannot exceed 100'],
  },
  minimumCharge: {
    type: Number,
    default: 3, // Minimum charge in USD
    min: [0, 'Minimum charge cannot be negative'],
  },
  maximumCharge: {
    type: Number,
    default: 100, // Maximum charge in USD
    min: [0, 'Maximum charge cannot be negative'],
  },
  // Coverage limits
  maxCoverageAmount: {
    type: Number,
    default: 5000, // Maximum coverage in USD
    min: [0, 'Max coverage cannot be negative'],
  },
  // Enable/disable insurance feature
  enabled: {
    type: Boolean,
    default: true,
  },
  // Description for users
  description: {
    type: String,
    default: 'Protect your shipment against loss, damage, or theft during transit.',
  },
  // Terms and conditions
  terms: {
    type: String,
    default: 'Insurance coverage applies from pickup to delivery. Claims must be filed within 48 hours of delivery.',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

export default mongoose.model('InsuranceSetting', insuranceSettingSchema);
