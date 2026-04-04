
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

await mongoose.connect('mongodb://localhost:27017/manufacturing_erp');

const hash = await bcrypt.hash('admin123', 10);
await mongoose.connection.collection('users').insertOne({
  email: 'admin@test.com',
  password: hash,
  name: 'Admin',
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

console.log('✅ User created!');
console.log('Email: admin@test.com');
console.log('Password: admin123');
await mongoose.disconnect();
