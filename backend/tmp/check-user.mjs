import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';

const email = 'qa.verification@demo.com';
const password = 'QaVerify#2026A';

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const user = await User.findOne({ email }).select('+password');
console.log('FOUND=' + Boolean(user));
if (user) {
  console.log('ACTIVE=' + user.isActive);
  console.log('ROLE=' + user.role);
  const ok = await user.comparePassword(password);
  console.log('PASS_OK=' + ok);
}
await mongoose.disconnect();
