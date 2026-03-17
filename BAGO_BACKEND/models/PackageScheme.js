import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fromCountry: {
    type: String,
    required: true,
    trim: true,
  },
  fromCity: {
    type: String,
    required: true,
    trim: true,
  },
  toCountry: {
    type: String,
    required: true,
    trim: true,
  },
  toCity: {
    type: String,
    required: true,
    trim: true,
  },
  packageWeight: {
    type: Number,
    required: true,
    min: [0, 'Weight must be a positive number'],
  },
  length: {
    type: Number,
    default: 0,
    min: 0,
  },
  width: {
    type: Number,
    default: 0,
    min: 0,
  },
  height: {
    type: Number,
    default: 0,
    min: 0,
  },
  value: {
    type: Number,
    default: 0,
    min: [0, 'Value must be a non-negative number'],
  },
  receiverName: {
    type: String,
    required: true,
    trim: true,
  },
  receiverEmail: {
    type: String,
    required: false,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  receiverPhone: {
    type: String,
    required: true,
    trim: true,
  },
  receiverPhoneCountryCode: {
    type: String,
    default: '+1',
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  image: {
    type: String,
    default: null,
  },
  // ✅ Item category and restricted items validation
  category: {
    type: String,
    enum: [
      'documents',
      'electronics',
      'clothing',
      'food_perishables',
      'fragile',
      'other'
    ],
    required: [true, 'Item category is required'],
  },
  isRestricted: {
    type: Boolean,
    default: false,
  },
  restrictedReason: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Package', packageSchema);
