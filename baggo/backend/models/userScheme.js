import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const transactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'escrow_hold', 'escrow_release', 'escrow_removed'],
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
    min: [0, 'Amount must be positive'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },
  description: {
    type: String,
    trim: true,
  },
});

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
  },
  image: {
    type: String,
    default: 'https://example.com/placeholder-profile.jpg',
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^\+?\d{10,15}$/, 'Please enter a valid phone number'],
  },
  otp: { code: String, expiresAt: Date },
  recipient_code: { type: String, default: null },
  dateOfBirth: { type: Date },
  country: { type: String },
  banned: { type: Boolean, default: false },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
  },
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  isVerified: { type: Boolean, default: false },
  stripeAccountId: { type: String, default: null },
  stripeVerified: { type: Boolean, default: false },
  pushTokens: {
    type: [String],
    default: [],
  },

  // 💰 Main Wallet
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative'],
  },
  balanceHistory: [transactionSchema],

  // 🏦 Escrow Wallet
  escrowBalance: {
    type: Number,
    default: 0,
    min: [0, 'Escrow balance cannot be negative'],
  },
  escrowHistory: [transactionSchema],

  // 🎁 Referral System
  referralCode: {
    type: String,
    unique: true,
  },
  referredBy: {
    type: String, // stores referralCode of the person who referred them
    default: null,
  },
  hasUsedReferralDiscount: {
    type: Boolean,
    default: false, // ensures 3% discount is applied only once
  },
  
  // 🆔 DIDIT.me KYC Verification
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'approved', 'declined'],
    default: 'not_started',
  },
  diditSessionId: {
    type: String,
    default: null,
  },
  diditSessionToken: {
    type: String,
    default: null,
  },
  kycVerifiedAt: {
    type: Date,
    default: null,
  },
});

// 🔒 Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 🎯 Auto-generate unique referral code before saving
userSchema.pre('save', async function (next) {
  if (!this.referralCode) {
    const randomCode = this.firstName.slice(0, 3).toUpperCase() + Math.floor(1000 + Math.random() * 9000);
    this.referralCode = randomCode;
  }
  next();
});

export default mongoose.model('User', userSchema);
