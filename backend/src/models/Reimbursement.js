const mongoose = require('mongoose');
const { EXPENSE_STATUS } = require('../config/constants');

const reimbursementSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    expenseTitle: {
        type: String,
        required: [true, 'Expense title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    expenseDate: {
        type: Date,
        required: [true, 'Expense date is required'],
        default: Date.now
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['travel', 'meals', 'field_expenses', 'office_supplies', 'other']
    },
    project: String,
    billable: {
        type: Boolean,
        default: false
    },
    receiptFile: {
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    },
    status: {
        type: String,
        enum: [
            EXPENSE_STATUS.PENDING,
            EXPENSE_STATUS.APPROVED,
            EXPENSE_STATUS.REJECTED,
            'paid'
        ],
        default: EXPENSE_STATUS.PENDING
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    paymentDate: Date,
    paymentReference: String,
    notes: String
}, {
    timestamps: true
});

// Indexes
reimbursementSchema.index({ employeeId: 1, createdAt: -1 });
reimbursementSchema.index({ userId: 1 });
reimbursementSchema.index({ status: 1 });
reimbursementSchema.index({ expenseDate: -1 });

module.exports = mongoose.model('Reimbursement', reimbursementSchema);