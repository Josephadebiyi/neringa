import mongoose from "mongoose";
const settingSheme = new mongoose.Schema({

  autoVerification: { type: Boolean, default: false },
  commissionPercentage: { type: Number, default: 15 },
  supportedAfricanCurrencies: {
    type: [String],
    default: ['NGN', 'GHS', 'KES', 'UGX', 'TZS', 'ZAR', 'RWF']
  },
});
export default mongoose.model("Setting", settingSheme);
