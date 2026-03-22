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
  banner: {
    tag: { type: String, default: 'DESTINATION SPECIAL' },
    title: { type: String, default: 'Lagos to London' },
    description: { type: String, default: 'Ship your packages starting from $4.99/kg' },
    buttonText: { type: String, default: 'Check Flights' },
    redirectLink: { type: String, default: '/(tabs)/packages' },
    imageUrl: { type: String, default: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=400&auto=format&fit=crop' },
    isActive: { type: Boolean, default: true }
  }
});
export default mongoose.model("Setting", settingSheme);
