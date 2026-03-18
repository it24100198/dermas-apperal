const Expense = require('../models/Expense');
const ExpenseCategory = require('../models/ExpenseCategory');
const Vendor = require('../models/Vendor');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { EXPENSE_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

// Create expense
exports.createExpense = catchAsync(async (req, res, next) => {
    // Add created by
    req.body.createdBy = req.user.id;
    
    // Validate category exists
    const category = await ExpenseCategory.findById(req.body.category);
    if (!category) {
        return next(new AppError('Category not found', 404));
    }
    
    // Validate subcategory if provided
    if (req.body.subCategory) {
        const subCategory = await ExpenseCategory.findById(req.body.subCategory);
        if (!subCategory || subCategory.parentCategory.toString() !== req.body.category) {
            return next(new AppError('Invalid subcategory for this category', 400));
        }
    }
    
    // Handle file upload
    if (req.file) {
        req.body.receiptFile = {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
        };
    }
    
    const expense = await Expense.create(req.body);
    
    // Populate references
    await expense.populate([
        { path: 'category', select: 'name type' },
        { path: 'subCategory', select: 'name' },
        { path: 'vendor', select: 'name' },
        { path: 'createdBy', select: 'name email' }
    ]);
    
    res.status(201).json({
        status: 'success',
        data: {
            expense
        }
    });
});

// Get all expenses with filtering
exports.getAllExpenses = catchAsync(async (req, res, next) => {
    const {
        page = 1,
        limit = 10,
        sort = '-date',
        status,
        category,
        department,
        vendor,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        search
    } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (department) filter.department = department;
    if (vendor) filter.vendor = vendor;
    
    // Date range filter
    if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
        filter.amount = {};
        if (minAmount) filter.amount.$gte = Number(minAmount);
        if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }
    
    // Search in title and description
    if (search) {
        filter.$or = [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }
    
    // Build query
    const query = Expense.find(filter);
    
    // Sorting
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortField = sort.replace('-', '');
    query.sort({ [sortField]: sortOrder });
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    query.skip(skip).limit(limitNum);
    
    // Populate references
    query.populate([
        { path: 'category', select: 'name type' },
        { path: 'subCategory', select: 'name' },
        { path: 'vendor', select: 'name' },
        { path: 'createdBy', select: 'name email' },
        { path: 'approvedBy', select: 'name' }
    ]);
    
    // Execute query
    const [expenses, totalCount] = await Promise.all([
        query.exec(),
        Expense.countDocuments(filter)
    ]);
    
    res.status(200).json({
        status: 'success',
        results: expenses.length,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        currentPage: pageNum,
        data: {
            expenses
        }
    });
});

// Get single expense
exports.getExpense = catchAsync(async (req, res, next) => {
    const expense = await Expense.findById(req.params.id)
        .populate([
            { path: 'category', select: 'name type' },
            { path: 'subCategory', select: 'name' },
            { path: 'vendor', select: 'name email phone' },
            { path: 'createdBy', select: 'name email' },
            { path: 'approvedBy', select: 'name' },
            { path: 'comments.user', select: 'name email role' }
        ]);
    
    if (!expense) {
        return next(new AppError('Expense not found', 404));
    }
    
    res.status(200).json({
        status: 'success',
        data: {
            expense
        }
    });
});

// Update expense
exports.updateExpense = catchAsync(async (req, res, next) => {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
        return next(new AppError('Expense not found', 404));
    }
    
    // Check if expense can be updated (only pending expenses can be updated)
    if (expense.status !== EXPENSE_STATUS.PENDING) {
        return next(new AppError('Only pending expenses can be updated', 400));
    }
    
    // Handle file upload
    if (req.file) {
        req.body.receiptFile = {
            filename: req.file.filename,
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
        };
    }
    
    // Update expense
    const updatedExpense = await Expense.findByIdAndUpdate(
        req.params.id,
        req.body,
        {
            new: true,
            runValidators: true
        }
    ).populate([
        { path: 'category', select: 'name type' },
        { path: 'subCategory', select: 'name' },
        { path: 'vendor', select: 'name' },
        { path: 'createdBy', select: 'name email' }
    ]);
    
    res.status(200).json({
        status: 'success',
        data: {
            expense: updatedExpense
        }
    });
});

// Delete expense
exports.deleteExpense = catchAsync(async (req, res, next) => {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
        return next(new AppError('Expense not found', 404));
    }
    
    // Only allow deletion of pending expenses
    if (expense.status !== EXPENSE_STATUS.PENDING) {
        return next(new AppError('Only pending expenses can be deleted', 400));
    }
    
    await Expense.findByIdAndDelete(req.params.id);
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});

// Add expense comment
exports.addExpenseComment = catchAsync(async (req, res, next) => {
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
        return next(new AppError('Comment is required', 400));
    }

    const expense = await Expense.findById(req.params.id);

    if (!expense) {
        return next(new AppError('Expense not found', 404));
    }

    expense.comments.push({
        user: req.user.id,
        comment: comment.trim()
    });

    await expense.save();

    await expense.populate({ path: 'comments.user', select: 'name email role' });

    res.status(200).json({
        status: 'success',
        data: {
            comments: expense.comments
        }
    });
});

// Approve expense
exports.approveExpense = catchAsync(async (req, res, next) => {
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
        return next(new AppError('Expense not found', 404));
    }
    
    if (expense.status !== EXPENSE_STATUS.PENDING) {
        return next(new AppError('Expense is not in pending state', 400));
    }
    
    expense.status = EXPENSE_STATUS.APPROVED;
    expense.approvedBy = req.user.id;
    expense.approvedAt = Date.now();
    
    await expense.save();
    
    res.status(200).json({
        status: 'success',
        data: {
            expense
        }
    });
});

// Reject expense
exports.rejectExpense = catchAsync(async (req, res, next) => {
    const { reason } = req.body;
    
    if (!reason) {
        return next(new AppError('Rejection reason is required', 400));
    }
    
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) {
        return next(new AppError('Expense not found', 404));
    }
    
    if (expense.status !== EXPENSE_STATUS.PENDING) {
        return next(new AppError('Expense is not in pending state', 400));
    }
    
    expense.status = EXPENSE_STATUS.REJECTED;
    expense.approvedBy = req.user.id;
    expense.approvedAt = Date.now();
    expense.rejectionReason = reason;
    
    await expense.save();
    
    res.status(200).json({
        status: 'success',
        data: {
            expense
        }
    });
});

// Bulk create expenses
exports.bulkCreateExpenses = catchAsync(async (req, res, next) => {
    const { expenses } = req.body;
    
    if (!Array.isArray(expenses) || expenses.length === 0) {
        return next(new AppError('Please provide an array of expenses', 400));
    }
    
    // Add createdBy to each expense
    const expensesWithUser = expenses.map(expense => ({
        ...expense,
        createdBy: req.user.id
    }));
    
    const createdExpenses = await Expense.insertMany(expensesWithUser);
    
    res.status(201).json({
        status: 'success',
        results: createdExpenses.length,
        data: {
            expenses: createdExpenses
        }
    });
});

// Get expense statistics
exports.getExpenseStats = catchAsync(async (req, res, next) => {
    const { year = new Date().getFullYear(), month } = req.query;
    
    const matchStage = {};
    
    if (year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        matchStage.date = { $gte: startDate, $lte: endDate };
    }
    
    if (month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        matchStage.date = { $gte: startDate, $lte: endDate };
    }
    
    const stats = await Expense.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                totalExpenses: { $sum: '$amount' },
                averageExpense: { $avg: '$amount' },
                minExpense: { $min: '$amount' },
                maxExpense: { $max: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    // Category breakdown
    const categoryBreakdown = await Expense.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$category',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'expensecategories',
                localField: '_id',
                foreignField: '_id',
                as: 'category'
            }
        },
        { $unwind: '$category' },
        {
            $project: {
                categoryName: '$category.name',
                total: 1,
                count: 1
            }
        }
    ]);
    
    // Monthly trend
    const monthlyTrend = await Expense.aggregate([
        {
            $match: {
                date: { $gte: new Date(year, 0, 1), $lte: new Date(year, 11, 31) }
            }
        },
        {
            $group: {
                _id: { $month: '$date' },
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
    
    res.status(200).json({
        status: 'success',
        data: {
            summary: stats[0] || { totalExpenses: 0, count: 0 },
            categoryBreakdown,
            monthlyTrend
        }
    });
});