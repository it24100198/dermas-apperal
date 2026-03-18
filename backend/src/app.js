const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const AppError = require('./utils/AppError');
const globalErrorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reimbursementRoutes = require('./routes/reimbursementRoutes');
const recurringExpenseRoutes = require('./routes/recurringExpenseRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const pettyCashRoutes = require('./routes/pettyCashRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    max: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again later!',
    skip: (req) => process.env.NODE_ENV !== 'production' // Skip rate limiting in development
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5000'
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/reimbursements', reimbursementRoutes);
app.use('/api/v1/recurring-expenses', recurringExpenseRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/vendors', vendorRoutes);
app.use('/api/v1/petty-cash', pettyCashRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Expense and Employee Management API is running',
        version: 'v1',
        health: '/health'
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Handle undefined routes (Express 5 requires named wildcard syntax)
app.all('/{*any}', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;