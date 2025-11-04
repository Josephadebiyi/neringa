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
  receiverPhone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Package', packageSchema);
