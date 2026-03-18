const User = require('../models/User');
const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { USER_ROLES } = require('../config/constants');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');

// Generate token
const signToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Create and send token response
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user);
    
    // Remove password from output
    user.password = undefined;
    
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

// Register
exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password, role, department } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError('User already exists with this email', 400));
    }
    
    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role: role || USER_ROLES.EMPLOYEE,
        department
    });
    
    createSendToken(user, 201, res);
});

// Login
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    
    // Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
    
    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    
    // Update last login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });
    
    createSendToken(user, 200, res);
});

// Logout
exports.logout = (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Logged out successfully'
    });
};

// Get current user
exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate('employeeId');
    
    res.status(200).json({
        status: 'success',
        data: {
            user
        }
    });
});

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    
    // Get user from collection
    const user = await User.findById(req.user.id).select('+password');
    
    // Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
        return next(new AppError('Your current password is wrong', 401));
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    createSendToken(user, 200, res);
});

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    
    // Get user based on email
    const user = await User.findOne({ email });
    if (!user) {
        return next(new AppError('There is no user with that email address', 404));
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    user.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    await user.save({ validateBeforeSave: false });
    
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}. If you did not request this, please ignore this email.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 minutes)',
            message
        });
    } catch (emailError) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError('Failed to send reset email. Please try again later.', 500));
    }
    
    res.status(200).json({
        status: 'success',
        message: 'Token sent to email',
        ...(process.env.NODE_ENV !== 'production' ? { resetToken } : {})
    });
});

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;
    
    // Get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');
    
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });
    
    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }
    
    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    createSendToken(user, 200, res);
});