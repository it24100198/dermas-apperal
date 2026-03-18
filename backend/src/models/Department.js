const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Department name is required'],
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Department code is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    description: String,
    manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    budget: {
        type: Number,
        default: 0
    },
    budgetPeriod: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        default: 'monthly'
    },
    costCenter: String,
    isActive: {
        type: Boolean,
        default: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes
departmentSchema.index({ manager: 1 });

module.exports = mongoose.model('Department', departmentSchema);