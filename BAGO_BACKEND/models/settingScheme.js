import mongoose from "mongoose";
const settingSheme = new mongoose.Schema({

  autoVerification: { type: Boolean, default: false },
  commissionPercentage: { type: Number, default: 15 },
  insurancePercentage: { type: Number, default: 5 },
  insuranceFixedAmount: { type: Number, default: 50 },
  insuranceType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  baseCurrency: { type: String, default: 'USD' },
  supportedCurrencies: {
    type: [String],
    default: ['USD', 'EUR', 'GBP', 'CAD', 'NGN', 'GHS', 'KES', 'ZAR']
  },
  exchangeRates: {
    type: Map,
    of: Number,
    default: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      CAD: 1.36,
      NGN: 1550,
      GHS: 15.2,
      KES: 129,
      ZAR: 18.5,
    }
  },
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
