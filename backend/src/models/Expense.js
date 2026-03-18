const mongoose = require('mongoose');
const { EXPENSE_STATUS, PAYMENT_METHODS } = require('../config/constants');

const expenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Expense title is required'],
        trim: true
    },
    description: String,
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
        required: [true, 'Category is required']
    },
    subCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory'
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor'
    },
    department: {
        type: String,
        required: [true, 'Department is required']
    },
    paymentMethod: {
        type: String,
        enum: Object.values(PAYMENT_METHODS),
        required: [true, 'Payment method is required']
    },
    date: {
        type: Date,
        required: [true, 'Expense date is required'],
        default: Date.now
    },
    status: {
        type: String,
        enum: Object.values(EXPENSE_STATUS),
        default: EXPENSE_STATUS.PENDING
    },
    receiptFile: {
        filename: String,
        path: String,
        mimetype: String,
        size: Number
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String,
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringExpenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecurringExpense'
    },
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        comment: {
            type: String,
            required: true,
            trim: true,
            maxlength: [500, 'Comment cannot exceed 500 characters']
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for better query performance
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ department: 1 });
expenseSchema.index({ status: 1 });
expenseSchema.index({ vendor: 1 });
expenseSchema.index({ createdBy: 1 });
expenseSchema.index({ 'metadata.paymentReference': 1 });
expenseSchema.index({ 'comments.user': 1 });

// Compound indexes for common queries
expenseSchema.index({ date: -1, status: 1 });
expenseSchema.index({ department: 1, date: -1 });
expenseSchema.index({ category: 1, date: -1 });

module.exports = mongoose.model('Expense', expenseSchema);