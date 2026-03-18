const mongoose = require('mongoose');
const Reimbursement = require('../models/Reimbursement');
const Employee = require('../models/Employee');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { EXPENSE_STATUS, USER_ROLES } = require('../config/constants');

const createAudit = async ({ req, action, documentId, changes }) => {
    try {
        await AuditLog.create({
            user: req.user._id,
            action,
            module: 'REIMBURSEMENT',
            documentId,
            documentModel: 'Reimbursement',
            changes,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });
    } catch (error) {
        // Avoid failing main business flow if audit logging fails.
        // eslint-disable-next-line no-console
        console.error('Audit log creation failed:', error.message);
    }
};

const resolveOrCreateEmployeeProfile = async (user) => {
    let employee = await Employee.findOne({ userId: user._id });
    if (employee) {
        return employee;
    }

    const nameParts = (user.name || 'Employee User').trim().split(/\s+/);
    const firstName = nameParts[0] || 'Employee';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    let employeeCode = `EMP${Date.now().toString().slice(-6)}`;
    // Ensure employeeCode uniqueness when creating profiles on-demand.
    // eslint-disable-next-line no-await-in-loop
    while (await Employee.exists({ employeeCode })) {
        employeeCode = `EMP${Math.floor(100000 + Math.random() * 900000)}`;
    }

    employee = await Employee.create({
        userId: user._id,
        employeeCode,
        firstName,
        lastName,
        email: user.email,
        phone: '0000000000',
        department: user.department || 'Administration',
        designation: 'Employee',
        joiningDate: new Date(),
        salary: 0,
        createdBy: user._id
    });

    await User.findByIdAndUpdate(user._id, { employeeId: employee._id });
    return employee;
};

exports.submitClaim = catchAsync(async (req, res, next) => {
    const employee = await resolveOrCreateEmployeeProfile(req.user);

    const category = req.body.category || req.body.expenseType;
    if (!category) {
        return next(new AppError('Reimbursement category is required', 400));
    }

    const reimbursementPayload = {
        ...req.body,
        employeeId: employee._id,
        userId: req.user._id,
        category,
        expenseDate: req.body.expenseDate || req.body.dateOfExpense || new Date()
    };

    if (req.file) {
        reimbursementPayload.receiptFile = {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
        };
    }

    const reimbursement = await Reimbursement.create(reimbursementPayload);

    await createAudit({
        req,
        action: 'CREATE',
        documentId: reimbursement._id,
        changes: { after: reimbursement.toObject() }
    });

    res.status(201).json({
        status: 'success',
        data: {
            reimbursement
        }
    });
});

exports.getAllReimbursements = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 20,
        sort = '-createdAt',
        status,
        category,
        employeeId,
        startDate,
        endDate
    } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (employeeId) filter.employeeId = employeeId;

    if (startDate || endDate) {
        filter.expenseDate = {};
        if (startDate) filter.expenseDate.$gte = new Date(startDate);
        if (endDate) filter.expenseDate.$lte = new Date(endDate);
    }

    if (req.user.role === USER_ROLES.EMPLOYEE) {
        const employee = await resolveOrCreateEmployeeProfile(req.user);
        filter.employeeId = employee._id;
    }

    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 20;
    const skip = (pageNum - 1) * limitNum;

    const [reimbursements, totalCount] = await Promise.all([
        Reimbursement.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum)
            .populate('employeeId', 'firstName lastName employeeCode department')
            .populate('approvedBy', 'name email role'),
        Reimbursement.countDocuments(filter)
    ]);

    res.status(200).json({
        status: 'success',
        results: reimbursements.length,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        currentPage: pageNum,
        data: {
            reimbursements
        }
    });
});

exports.getReimbursement = catchAsync(async (req, res, next) => {
    const reimbursement = await Reimbursement.findById(req.params.id)
        .populate('employeeId', 'firstName lastName employeeCode department userId')
        .populate('approvedBy', 'name email role');

    if (!reimbursement) {
        return next(new AppError('Reimbursement not found', 404));
    }

    if (req.user.role === USER_ROLES.EMPLOYEE) {
        const employee = await resolveOrCreateEmployeeProfile(req.user);
        if (reimbursement.employeeId._id.toString() !== employee._id.toString()) {
            return next(new AppError('You are not authorized to view this reimbursement', 403));
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            reimbursement
        }
    });
});

exports.updateReimbursementStatus = catchAsync(async (req, res, next) => {
    const { status, reason } = req.body;
    const validStatuses = [EXPENSE_STATUS.APPROVED, EXPENSE_STATUS.REJECTED];

    if (!validStatuses.includes(status)) {
        return next(new AppError('Status must be approved or rejected', 400));
    }

    const reimbursement = await Reimbursement.findById(req.params.id);
    if (!reimbursement) {
        return next(new AppError('Reimbursement not found', 404));
    }

    if (reimbursement.status !== EXPENSE_STATUS.PENDING) {
        return next(new AppError('Only pending claims can be processed', 400));
    }

    if (status === EXPENSE_STATUS.REJECTED && !reason) {
        return next(new AppError('Rejection reason is required', 400));
    }

    const before = reimbursement.toObject();
    reimbursement.status = status;
    reimbursement.approvedBy = req.user._id;
    reimbursement.approvedAt = new Date();
    reimbursement.rejectionReason = status === EXPENSE_STATUS.REJECTED ? reason : undefined;

    await reimbursement.save();

    await createAudit({
        req,
        action: status === EXPENSE_STATUS.APPROVED ? 'APPROVE' : 'REJECT',
        documentId: reimbursement._id,
        changes: {
            before,
            after: reimbursement.toObject()
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            reimbursement
        }
    });
});

exports.markAsPaid = catchAsync(async (req, res, next) => {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
        return next(new AppError('Reimbursement not found', 404));
    }

    if (reimbursement.status !== EXPENSE_STATUS.APPROVED) {
        return next(new AppError('Only approved claims can be marked as paid', 400));
    }

    const before = reimbursement.toObject();
    reimbursement.status = 'paid';
    reimbursement.paymentDate = new Date();
    reimbursement.paymentReference = req.body.paymentReference || reimbursement.paymentReference;
    reimbursement.notes = req.body.notes || reimbursement.notes;

    await reimbursement.save();

    await createAudit({
        req,
        action: 'UPDATE',
        documentId: reimbursement._id,
        changes: {
            before,
            after: reimbursement.toObject()
        }
    });

    res.status(200).json({
        status: 'success',
        data: {
            reimbursement
        }
    });
});

exports.getReimbursementSummary = catchAsync(async (req, res, next) => {
    const { employeeId, startDate, endDate } = req.query;
    const matchStage = {};

    if (employeeId) {
        matchStage.employeeId = new mongoose.Types.ObjectId(employeeId);
    }

    if (startDate || endDate) {
        matchStage.expenseDate = {};
        if (startDate) matchStage.expenseDate.$gte = new Date(startDate);
        if (endDate) matchStage.expenseDate.$lte = new Date(endDate);
    }

    if (req.user.role === USER_ROLES.EMPLOYEE) {
        const employee = await resolveOrCreateEmployeeProfile(req.user);
        matchStage.employeeId = employee._id;
    }

    const summary = await Reimbursement.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: {
                    status: '$status',
                    category: '$category'
                },
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $group: {
                _id: '$_id.status',
                categories: {
                    $push: {
                        category: '$_id.category',
                        totalAmount: '$totalAmount',
                        count: '$count'
                    }
                },
                totalAmount: { $sum: '$totalAmount' },
                totalCount: { $sum: '$count' }
            }
        }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            summary
        }
    });
});