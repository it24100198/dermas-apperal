const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { USER_ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false
    },
    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.EMPLOYEE
    },
    department: {
        type: String,
        required: function() {
            return this.role !== USER_ROLES.ADMIN;
        }
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });

// Hash password and update passwordChangedAt before saving
userSchema.pre('save', async function() {
    try {
        // Hash password before saving
        if (this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            
            // Update passwordChangedAt when password is changed
            if (!this.isNew) {
                this.passwordChangedAt = Date.now() - 1000;
            }
        }
    } catch (error) {
        throw error;
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.getSignedJwtToken = function() {
    return jwt.sign(
        { 
            id: this._id,
            name: this.name,
            email: this.email,
            role: this.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Check if password was changed after token issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);