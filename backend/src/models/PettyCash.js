const mongoose = require('mongoose');

const pettyCashSchema = new mongoose.Schema({
    transactionDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['addition', 'expense'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    category: {
        type: String,
        enum: ['office_supplies', 'travel', 'meals', 'miscellaneous'],
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'bank_transfer'],
        default: 'cash'
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
    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    notes: String,
    balance: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Indexes
pettyCashSchema.index({ transactionDate: -1 });
pettyCashSchema.index({ type: 1 });
pettyCashSchema.index({ handledBy: 1 });

// Static method to get current balance
pettyCashSchema.statics.getCurrentBalance = async function() {
    const result = await this.aggregate([
        {
            $group: {
                _id: null,
                totalAdditions: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'addition'] }, '$amount', 0]
                    }
                },
                totalExpenses: {
                    $sum: {
                        $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
                    }
                }
            }
        },
        {
            $project: {
                balance: { $subtract: ['$totalAdditions', '$totalExpenses'] }
            }
        }
    ]);
    
    return result.length > 0 ? result[0].balance : 0;
};

module.exports = mongoose.model('PettyCash', pettyCashSchema);