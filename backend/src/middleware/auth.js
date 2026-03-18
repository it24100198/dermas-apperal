const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
    }
    
    try {
        // Verify token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        
        // Check if user still exists
        const user = await User.findById(decoded.id).select('+password');
        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }
        
        // Check if user changed password after token was issued
        if (user.changedPasswordAfter(decoded.iat)) {
            return next(new AppError('User recently changed password. Please log in again.', 401));
        }
        
        // Grant access
        req.user = user;
        next();
    } catch (error) {
        return next(new AppError('Invalid token. Please log in again.', 401));
    }
});