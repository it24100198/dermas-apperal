const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        
        // Create indexes
        await createIndexes();
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

const createIndexes = async () => {
    const collections = ['users', 'expenses', 'reimbursements', 'employees'];
    
    for (const collection of collections) {
        try {
            await mongoose.connection.collection(collection).createIndexes();
        } catch (error) {
            console.log(`Indexes for ${collection} already exist or error:`, error.message);
        }
    }
};

module.exports = connectDB;