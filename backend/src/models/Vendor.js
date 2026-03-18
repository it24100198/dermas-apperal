const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vendor name is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['vendor', 'landlord', 'supplier', 'service_provider'],
        required: true
    },
    contactPerson: String,
    email: {
        type: String,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email'
        ]
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    alternatePhone: String,
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
    },
    gstNumber: String,
    panNumber: String,
    bankDetails: {
        accountNumber: String,
        bankName: String,
        ifscCode: String
    },
    paymentTerms: {
        type: String,
        enum: ['immediate', '7_days', '15_days', '30_days', '45_days', '60_days'],
        default: 'immediate'
    },
    contracts: [{
        title: String,
        file: String,
        startDate: Date,
        endDate: Date,
        value: Number
    }],
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    notes: String,
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
vendorSchema.index({ name: 1 });
vendorSchema.index({ type: 1 });
vendorSchema.index({ email: 1 });
vendorSchema.index({ phone: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);