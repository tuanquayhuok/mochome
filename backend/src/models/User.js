const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, enum: ['', 'male', 'female', 'other'], default: '' },
    address: {
      province: { type: String, default: '' },
      district: { type: String, default: '' },
      ward: { type: String, default: '' },
      street: { type: String, default: '' },
      zip: { type: String, default: '' }
    },
    claimedMilestones: { type: [String], default: [] },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    isActive: { type: Boolean, default: true },
    emailVerifiedAt: { type: Date, default: null },
    activationTokenHash: { type: String, default: '' },
    activationTokenExpiresAt: { type: Date, default: null },
    isVip: { type: Boolean, default: false },
    loginAttempts: { type: Number, required: true, default: 0 },
    lockUntil: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
