import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reviewer is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false } // optional: prevents creating separate _id for each review
);

const tripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    fromLocation: {
      type: String,
      required: [true, 'Departure city is required'],
      trim: true,
      minlength: [2, 'Departure city must be at least 2 characters'],
    },
    toLocation: {
      type: String,
      required: [true, 'Arrival city is required'],
      trim: true,
      minlength: [2, 'Arrival city must be at least 2 characters'],
    },
    departureDate: {
      type: Date,
      required: [true, 'Departure date is required'],
    },
    arrivalDate: {
      type: Date,
      required: [true, 'Arrival date is required'],
    },
    availableKg: {
      type: Number,
      required: [true, 'Available luggage space is required'],
      min: [0, 'Available weight cannot be negative'],
    },
    travelMeans: {
      type: String,
      enum: ['airplane', 'bus', 'train', 'car', 'ship', 'other'],
      required: [true, 'Travel means is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    request: {
      type: Number,
      default: 0,
      min: [0, 'Request count cannot be negative'],
    },
    reviews: [reviewSchema], // ✅ Added reviews field
  },
  { timestamps: true }
);

// Prevent model overwrite
const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);

export default Trip;
