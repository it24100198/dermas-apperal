const mongoose = require('mongoose');
const { RECURRING_FREQUENCY, EXPENSE_STATUS } = require('../config/constants');

const recurringExpenseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
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
        required: true
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
        enum: ['cash', 'bank_transfer', 'credit_card'],
        required: true
    },
    frequency: {
        type: String,
        enum: Object.values(RECURRING_FREQUENCY),
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: Date,
    nextDueDate: {
        type: Date,
        required: true
    },
    lastGeneratedDate: Date,
    status: {
        type: String,
        enum: ['active', 'paused', 'completed', 'cancelled'],
        default: 'active'
    },
    autoApprove: {
        type: Boolean,
        default: false
    },
    createdExpenses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense'
    }],
    notes: String,
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Indexes
recurringExpenseSchema.index({ nextDueDate: 1 });
recurringExpenseSchema.index({ status: 1 });
recurringExpenseSchema.index({ category: 1 });

// Calculate next due date
recurringExpenseSchema.methods.calculateNextDueDate = function() {
    const currentDate = this.nextDueDate || new Date();
    const nextDate = new Date(currentDate);
    
    switch(this.frequency) {
        case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
        case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
        case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
    }
    
    return nextDate;
};

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);