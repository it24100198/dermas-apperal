const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handle uncaught exceptions
process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
});

dotenv.config({ path: './.env' });
const app = require('./src/app');

const port = process.env.PORT || 5000;
let server;

// Database connection then server start
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
        server = app.listen(port, () => {
            console.log(`✅ Server running on port ${port} in ${process.env.NODE_ENV} mode`);
        });
    })
    .catch(err => {
        console.log('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Handle unhandled rejections
process.on('unhandledRejection', err => {
    console.log('UNHANDLED REJECTION! 💥 Shutting down...');
    console.log(err.name, err.message);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
});