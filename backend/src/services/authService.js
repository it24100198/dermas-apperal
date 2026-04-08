import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export async function login(email, password) {
  const user = await User.findOne({ email, isActive: true }).select('+password');
  if (!user) throw new Error('Invalid email or password');
  const valid = await user.comparePassword(password);
  if (!valid) throw new Error('Invalid email or password');
  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const u = user.toObject();
  delete u.password;
  return { user: u, token };
}

export async function getMe(userId) {
  const user = await User.findById(userId).lean();
  if (!user) throw new Error('User not found');
  return user;
}
