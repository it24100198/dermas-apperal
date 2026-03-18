const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    employeeCode: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    department: {
        type: String,
        required: [true, 'Department is required']
    },
    designation: {
        type: String,
        required: [true, 'Designation is required']
    },
    joiningDate: {
        type: Date,
        required: [true, 'Joining date is required']
    },
    salary: {
        type: Number,
        required: [true, 'Salary is required']
    },
    bankDetails: {
        accountNumber: String,
        bankName: String,
        ifscCode: String
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    emergencyContact: {
        name: String,
        relationship: String,
        phone: String
    },
    documents: [{
        name: String,
        file: String,
        uploadedAt: Date
    }],
    status: {
        type: String,
        enum: ['active', 'inactive', 'on_leave', 'terminated'],
        default: 'active'
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
employeeSchema.index({ department: 1 });
employeeSchema.index({ status: 1 });

// Virtual for full name
employeeSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Employee', employeeSchema);