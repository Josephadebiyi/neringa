import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  // Origin details
  originCity: {
    type: String,
    required: [true, 'Origin city is required'],
    trim: true,
  },
  originCountry: {
    type: String,
    required: [true, 'Origin country is required'],
    trim: true,
  },
  originCountryCode: {
    type: String,
    required: [true, 'Origin country code is required'],
    trim: true,
    uppercase: true,
    maxlength: 3,
  },
  
  // Destination details
  destinationCity: {
    type: String,
    required: [true, 'Destination city is required'],
    trim: true,
  },
  destinationCountry: {
    type: String,
    required: [true, 'Destination country is required'],
    trim: true,
  },
  destinationCountryCode: {
    type: String,
    required: [true, 'Destination country code is required'],
    trim: true,
    uppercase: true,
    maxlength: 3,
  },

  // Pricing (base price per kg)
  basePricePerKg: {
    type: Number,
    required: [true, 'Base price per kg is required'],
    min: [0, 'Price cannot be negative'],
  },
  
  // Currency for pricing (default NGN for African routes)
  currency: {
    type: String,
    default: 'NGN',
    enum: ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'],
  },
  
  // Traveler commission percentage (e.g., 70 means traveler gets 70%)
  travelerCommissionPercent: {
    type: Number,
    required: true,
    default: 70,
    min: [0, 'Commission cannot be negative'],
    max: [100, 'Commission cannot exceed 100%'],
  },
  
  // Platform fee percentage (what Baggo keeps)
  platformFeePercent: {
    type: Number,
    default: 30,
    min: [0, 'Fee cannot be negative'],
    max: [100, 'Fee cannot exceed 100%'],
  },

  // Minimum shipment weight (kg)
  minWeightKg: {
    type: Number,
    default: 0.5,
    min: [0.1, 'Minimum weight must be at least 0.1 kg'],
  },
  
  // Maximum shipment weight per booking (kg)
  maxWeightKg: {
    type: Number,
    default: 30,
    min: [1, 'Maximum weight must be at least 1 kg'],
  },

  // Estimated delivery time range (in days)
  estimatedDeliveryMinDays: {
    type: Number,
    default: 3,
  },
  estimatedDeliveryMaxDays: {
    type: Number,
    default: 7,
  },

  // Supported transport modes for this route
  supportedTransportModes: [{
    type: String,
    enum: ['air', 'bus', 'ship', 'train', 'car'],
  }],

  // Route status
  isActive: {
    type: Boolean,
    default: true,
  },

  // Is this an African route (affects payment gateway)
  isAfricanRoute: {
    type: Boolean,
    default: false,
  },

  // Additional notes for admin
  notes: {
    type: String,
    trim: true,
  },

  // Created/Updated by admin
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
});

// Compound index for unique routes
routeSchema.index(
  { originCity: 1, originCountryCode: 1, destinationCity: 1, destinationCountryCode: 1 },
  { unique: true }
);

// Index for searching routes
routeSchema.index({ originCountryCode: 1, destinationCountryCode: 1 });
routeSchema.index({ isActive: 1 });
routeSchema.index({ isAfricanRoute: 1 });

// Virtual for route display name
routeSchema.virtual('displayName').get(function() {
  return `${this.originCity}, ${this.originCountryCode} → ${this.destinationCity}, ${this.destinationCountryCode}`;
});

// Method to calculate price for a given weight
routeSchema.methods.calculatePrice = function(weightKg) {
  const totalPrice = this.basePricePerKg * weightKg;
  const travelerEarning = totalPrice * (this.travelerCommissionPercent / 100);
  const platformFee = totalPrice * (this.platformFeePercent / 100);
  
  return {
    totalPrice: Math.round(totalPrice * 100) / 100,
    travelerEarning: Math.round(travelerEarning * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    currency: this.currency,
    pricePerKg: this.basePricePerKg,
    weightKg,
  };
};

// Pre-save hook to auto-detect African routes
routeSchema.pre('save', function(next) {
  const africanCountryCodes = ['NG', 'GH', 'KE', 'ZA', 'EG', 'MA', 'TZ', 'UG', 'RW', 'ET', 'SN', 'CI', 'CM', 'ZM', 'ZW'];
  
  // If either origin or destination is African, mark as African route
  this.isAfricanRoute = africanCountryCodes.includes(this.originCountryCode) || 
                        africanCountryCodes.includes(this.destinationCountryCode);
  
  // Ensure platformFee + travelerCommission = 100
  this.platformFeePercent = 100 - this.travelerCommissionPercent;
  
  next();
});

export default mongoose.model('Route', routeSchema);
