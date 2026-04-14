import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

// Use MongoDB SRV connection string (URL-encoded password)
const mongoUri = 'mongodb+srv://Dermas:Abcd123%21@ac-bmex2mk.7ooxfku.mongodb.net/manufacturing_erp?retryWrites=true&w=majority';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!');
    
    const schema = new mongoose.Schema({}, { strict: false });
    const Employee = mongoose.model('Employee', schema, 'employees');
    
    const email = 'admin@dermas.local';
    const password = 'Admin@2026';
    const pwd = await bcryptjs.hash(password, 10);
    
    console.log('Creating admin user...');
    const result = await Employee.findOneAndUpdate(
      { email },
      { 
        email,
        firstName: 'Admin',
        lastName: 'User',
        password: pwd,
        isActive: true,
        employeeId: 'ADM-' + Date.now(),
        department: 'Administration',
        role: 'admin'
      },
      { upsert: true, new: true }
    );
    
    console.log('\n✅ ADMIN USER CREATED:\n');
    console.log('Email: ' + email);
    console.log('Password: ' + password);
    
    await mongoose.disconnect();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

createAdmin();
