const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['master', 'sub'],
        required: true
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseCategory',
        required: function() {
            return this.type === 'sub';
        }
    },
    description: String,
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
expenseCategorySchema.index({ type: 1 });
expenseCategorySchema.index({ parentCategory: 1 });

// Pre-save middleware to ensure master categories exist
expenseCategorySchema.pre('save', async function(next) {
    if (this.type === 'sub' && !this.parentCategory) {
        next(new Error('Sub category must have a parent category'));
    }
    next();
});

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);