import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, select: false },
    name: { type: String, trim: true },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    profilePhoto: { type: String, trim: true, default: '' },
    preferences: {
      emailNotifications: { type: Boolean, default: true },
      systemAlerts: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
    },
    role: { type: String, enum: ['admin', 'supervisor', 'user'], default: 'user' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  if (/^\$2[aby]\$\d{2}\$/.test(this.password)) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
