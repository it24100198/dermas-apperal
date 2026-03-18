const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'EXPORT']
    },
    module: {
        type: String,
        required: true,
        enum: ['EXPENSE', 'REIMBURSEMENT', 'EMPLOYEE', 'VENDOR', 'CATEGORY', 'RECURRING', 'PETTY_CASH', 'REPORT', 'AUTH']
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'documentModel'
    },
    documentModel: {
        type: String,
        enum: ['Expense', 'Reimbursement', 'Employee', 'Vendor', 'ExpenseCategory', 'RecurringExpense', 'PettyCash']
    },
    changes: {
        type: mongoose.Schema.Types.Mixed
    },
    ipAddress: String,
    userAgent: String,
    status: {
        type: String,
        enum: ['success', 'failure'],
        default: 'success'
    },
    errorMessage: String,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, action: 1 });
auditLogSchema.index({ documentId: 1 });
auditLogSchema.index({ createdAt: -1 });

// TTL index to automatically delete logs older than 90 days
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);