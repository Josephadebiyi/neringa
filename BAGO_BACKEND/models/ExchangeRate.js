import mongoose from 'mongoose';

const exchangeRateSchema = new mongoose.Schema({
  baseCurrency: {
    type: String,
    required: true,
    default: 'USD',
  },
  rates: {
    type: Map,
    of: Number,
    required: true,
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now,
  }
}, { timestamps: true });

// Ensure we only have one record for the current base currency rates
exchangeRateSchema.index({ baseCurrency: 1 }, { unique: true });

export default mongoose.models.ExchangeRate || mongoose.model('ExchangeRate', exchangeRateSchema);
