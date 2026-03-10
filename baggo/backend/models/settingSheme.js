import mongoose from "mongoose";
const settingSheme = new mongoose.Schema({

  autoVerification: { type: Boolean, default: false },
  commissionPercentage: { type: Number, default: 15 },
  insurancePercentage: { type: Number, default: 5 },
  insuranceFixedAmount: { type: Number, default: 50 },
  insuranceType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  supportedAfricanCurrencies: {
    type: [String],
    default: ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF']
  },
});
export default mongoose.model("Setting", settingSheme);
