import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const adminSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  userName: {
    type: String,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["SUPER_ADMIN", "SAFETY_ADMIN", "SUPPORT_ADMIN"],
    default: "SUPPORT_ADMIN",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Password hashing
adminSchema.statics.hashPassword = async function(password) {
  return bcrypt.hash(password, 12);
};

// Password comparison
adminSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Pre-save hook to hash password if modified
adminSchema.pre('save', async function(next) {
  if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$2')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  }
  next();
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
