import mongoose from 'mongoose';

const RequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender user ID is required'],
    },
    image: { type: String, default: null },
    senderProof: { type: String, default: null }, // stores single image URL / dataURI
    senderReceived: { type: Boolean, default: false }, // sender confirms receipt
    amount: {
      type: Number,
      min: [0, 'Amount must be positive'],
    },
    traveler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Traveler user ID is required'],
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package ID is required'],
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: [true, 'Trip ID is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'intransit', 'delivering', 'completed', 'cancelled'],
      default: 'pending',
    },
    insurance: {
      type: Boolean,
      default: false,
    },
    insuranceCost: {
      type: Number,
      default: 0,
      min: [0, 'Insurance cost cannot be negative'],
    },
    movementTracking: [
      {
        status: {
          type: String,
          enum: ['intransit', 'delivering', 'completed'],
        },
        location: {
          type: String,
          trim: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    ],
    paymentInfo: {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: false, // optional, can be null if not set yet
    },
    method: {
      type: String,
      enum: ['stripe', 'paystack', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['paid', 'failed', null],
      default: null,
    },
  },

    estimatedDeparture: {
      type: Date,
    },
    estimatedArrival: {
      type: Date,
    },
updatedAt: Date,
    // 🆕 dispute field
    dispute: {
      type: {
        raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String, trim: true },
        status: {
          type: String,
          enum: ['open', 'resolved', 'rejected'],
          default: 'open',
        },
        createdAt: { type: Date, default: Date.now },
        resolvedAt: { type: Date, default: null },
        resolutionNote: { type: String, trim: true, default: null },
      },
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Request', RequestSchema);
