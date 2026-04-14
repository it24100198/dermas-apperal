import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const mongoUri = 'mongodb://Dermas:Abcd123!@ac-bmex2mk-shard-00-00.7ooxfku.mongodb.net:27017,ac-bmex2mk-shard-00-01.7ooxfku.mongodb.net:27017,ac-bmex2mk-shard-00-02.7ooxfku.mongodb.net:27017/manufacturing_erp?ssl=true&retryWrites=true&w=majority';

async function createTestUser() {
  try {
    await mongoose.connect(mongoUri);
    const schema = new mongoose.Schema({}, { strict: false });
    const Employee = mongoose.model('Employee', schema, 'employees');
    
    const pwd = await bcrypt.hash('E2ETest#2026', 10);
    
    const result = await Employee.findOneAndUpdate(
      { email: 'e2e.verification@test.local' },
      { 
        email: 'e2e.verification@test.local',
        firstName: 'E2E',
        lastName: 'Test',
        password: pwd,
        isActive: true,
        employeeId: 'E2E-' + Date.now(),
        department: 'Testing'
      },
      { upsert: true, new: true }
    );
    
    console.log('TEST USER CREATED/UPDATED:');
    console.log('Email: e2e.verification@test.local');
    console.log('Password: E2ETest#2026');
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

createTestUser();
