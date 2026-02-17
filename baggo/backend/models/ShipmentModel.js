import mongoose from 'mongoose';

// List of African country codes for payment gateway detection
const AFRICAN_COUNTRY_CODES = [
  'NG', 'GH', 'KE', 'ZA', 'EG', 'MA', 'TZ', 'UG', 'RW', 'ET', 
  'SN', 'CI', 'CM', 'ZM', 'ZW', 'AO', 'BW', 'MW', 'MZ', 'NA',
  'BJ', 'BF', 'GA', 'GM', 'GN', 'LR', 'ML', 'MR', 'NE', 'SL', 'TG'
];

// Currency mapping for countries
const COUNTRY_CURRENCY_MAP = {
  'NG': { currency: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  'GH': { currency: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi' },
  'KE': { currency: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  'ZA': { currency: 'ZAR', symbol: 'R', name: 'South African Rand' },
  'US': { currency: 'USD', symbol: '$', name: 'US Dollar' },
  'GB': { currency: 'GBP', symbol: '£', name: 'British Pound' },
  'EU': { currency: 'EUR', symbol: '€', name: 'Euro' },
  'FR': { currency: 'EUR', symbol: '€', name: 'Euro' },
  'DE': { currency: 'EUR', symbol: '€', name: 'Euro' },
  'CA': { currency: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
};

/**
 * Helper function to determine if a country is African
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {boolean}
 */
export function isAfricanCountry(countryCode) {
  return AFRICAN_COUNTRY_CODES.includes(countryCode?.toUpperCase());
}

/**
 * Get the appropriate payment gateway for a country
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {'paystack' | 'stripe'}
 */
export function getPaymentGatewayForCountry(countryCode) {
  return isAfricanCountry(countryCode) ? 'paystack' : 'stripe';
}

/**
 * Get currency info for a country
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {object} Currency info with currency code, symbol, and name
 */
export function getCurrencyForCountry(countryCode) {
  const code = countryCode?.toUpperCase();
  return COUNTRY_CURRENCY_MAP[code] || { currency: 'USD', symbol: '$', name: 'US Dollar' };
}

// Shipment schema for individual bookings
const shipmentSchema = new mongoose.Schema({
  // Reference to the route
  routeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route',
    required: true,
  },
  
  // Sender info
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Traveler info (carrier)
  travelerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Trip reference
  tripId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  // Package details
  packageDescription: {
    type: String,
    required: true,
    trim: true,
  },
  packageCategory: {
    type: String,
    required: true,
    enum: ['electronics', 'clothing', 'documents', 'food', 'cosmetics', 'gifts', 'medicine', 'other'],
  },
  weightKg: {
    type: Number,
    required: true,
    min: [0.1, 'Weight must be at least 0.1 kg'],
  },
  declaredValue: {
    type: Number,
    required: true,
    min: [0, 'Declared value cannot be negative'],
  },
  declaredValueCurrency: {
    type: String,
    default: 'USD',
  },

  // Pricing breakdown
  pricing: {
    totalAmount: { type: Number, required: true },
    travelerEarning: { type: Number, required: true },
    platformFee: { type: Number, required: true },
    currency: { type: String, required: true },
    pricePerKg: { type: Number, required: true },
  },

  // Payment info
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending',
  },
  paymentGateway: {
    type: String,
    enum: ['stripe', 'paystack'],
    required: true,
  },
  paymentReference: {
    type: String,
  },
  paidAt: {
    type: Date,
  },

  // Tracking
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  // Shipment status
  status: {
    type: String,
    enum: ['pending_payment', 'pending_pickup', 'in_transit', 'delivered', 'cancelled', 'disputed'],
    default: 'pending_payment',
  },

  // Status history for tracking
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],

  // Pickup & delivery details
  pickupAddress: {
    address: String,
    city: String,
    country: String,
    postalCode: String,
    phone: String,
    instructions: String,
  },
  deliveryAddress: {
    address: String,
    city: String,
    country: String,
    postalCode: String,
    phone: String,
    recipientName: String,
    instructions: String,
  },

  // Scheduled dates
  scheduledPickupDate: Date,
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date,

  // Documents
  receiptPdfUrl: String,
  customsDeclarationUrl: String,

  // Notes
  senderNotes: String,
  travelerNotes: String,
  adminNotes: String,

}, {
  timestamps: true,
});

// Generate unique tracking number
shipmentSchema.pre('save', async function(next) {
  if (!this.trackingNumber && this.paymentStatus === 'paid') {
    const prefix = 'BGO';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.trackingNumber = `${prefix}${timestamp}${random}`;
  }
  next();
});

// Index for tracking number lookup
shipmentSchema.index({ trackingNumber: 1 });
shipmentSchema.index({ senderId: 1, status: 1 });
shipmentSchema.index({ travelerId: 1, status: 1 });
shipmentSchema.index({ paymentStatus: 1 });
shipmentSchema.index({ createdAt: -1 });

export const Shipment = mongoose.model('Shipment', shipmentSchema);

export { AFRICAN_COUNTRY_CODES, COUNTRY_CURRENCY_MAP };
