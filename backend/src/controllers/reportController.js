const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Reimbursement = require('../models/Reimbursement');
const calculationService = require('../services/calculationService');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { EXPENSE_STATUS } = require('../config/constants');

const parseYearMonth = (year, month) => {
    const parsedYear = Number(year);
    const parsedMonth = month !== undefined ? Number(month) : undefined;

    if (!parsedYear || Number.isNaN(parsedYear)) {
        throw new AppError('Valid year is required', 400);
    }

    if (parsedMonth !== undefined && (Number.isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12)) {
        throw new AppError('Month must be between 1 and 12', 400);
    }

    const startDate = parsedMonth
        ? new Date(parsedYear, parsedMonth - 1, 1)
        : new Date(parsedYear, 0, 1);

    const endDate = parsedMonth
        ? new Date(parsedYear, parsedMonth, 0, 23, 59, 59)
        : new Date(parsedYear, 11, 31, 23, 59, 59);

    return {
        year: parsedYear,
        month: parsedMonth,
        startDate,
        endDate
    };
};

const buildExpenseFilter = ({ startDate, endDate, department, category }) => {
    const filter = {
        date: { $gte: startDate, $lte: endDate },
        status: EXPENSE_STATUS.APPROVED
    };

    if (department) filter.department = department;
    if (category) filter.category = category;

    return filter;
};

const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const normalized = String(value);
    if (normalized.includes(',') || normalized.includes('"') || normalized.includes('\n')) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
};

const toCsv = (headers, rows) => {
    const headerLine = headers.map((header) => escapeCsv(header)).join(',');
    const rowLines = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(','));
    return [headerLine, ...rowLines].join('\n');
};

exports.getMonthlyExpenseReport = catchAsync(async (req, res, next) => {
    const { year, month, department, category } = req.query;

    if (!year || !month) {
        return next(new AppError('Year and month are required for monthly report', 400));
    }

    const range = parseYearMonth(year, month);
    const expenseFilter = buildExpenseFilter({
        ...range,
        department,
        category
    });

    const reimbursementFilter = {
        expenseDate: { $gte: range.startDate, $lte: range.endDate },
        status: EXPENSE_STATUS.APPROVED
    };

    const [
        expenses,
        reimbursements,
        categoryBreakdown,
        departmentBreakdown,
        paymentMethodBreakdown,
        totalPayroll
    ] = await Promise.all([
        Expense.find(expenseFilter)
            .populate('category', 'name type')
            .populate('subCategory', 'name')
            .populate('vendor', 'name')
            .populate('createdBy', 'name email role')
            .sort('-date'),
        Reimbursement.find(reimbursementFilter)
            .populate('employeeId', 'firstName lastName employeeCode department')
            .populate('approvedBy', 'name email role')
            .sort('-expenseDate'),
        calculationService.getCategoryExpenses(range.startDate, range.endDate),
        calculationService.getDepartmentExpenses(range.startDate, range.endDate),
        Expense.aggregate([
            { $match: expenseFilter },
            {
                $group: {
                    _id: '$paymentMethod',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]),
        calculationService.calculatePayroll(range.startDate, range.endDate)
    ]);

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalReimbursements = reimbursements.reduce((sum, item) => sum + item.amount, 0);

    res.status(200).json({
        status: 'success',
        data: {
            period: range,
            summary: {
                totalExpenses,
                totalPayroll,
                totalReimbursements,
                operationalExpenses: totalExpenses + totalPayroll + totalReimbursements,
                expenseCount: expenses.length,
                reimbursementCount: reimbursements.length
            },
            categoryBreakdown,
            departmentBreakdown,
            paymentMethodBreakdown,
            expenses,
            reimbursements
        }
    });
});

exports.getYearlyExpenseReport = catchAsync(async (req, res, next) => {
    const { year, department, category } = req.query;
    if (!year) {
        return next(new AppError('Year is required for yearly report', 400));
    }

    const range = parseYearMonth(year);
    const expenseFilter = buildExpenseFilter({
        ...range,
        department,
        category
    });

    const [totalExpenses, totalPayroll, totalReimbursements, monthlyBreakdown, categoryBreakdown, departmentBreakdown] = await Promise.all([
        calculationService.calculateTotalExpenses(range.startDate, range.endDate, department),
        calculationService.calculatePayroll(range.startDate, range.endDate, department),
        calculationService.calculateReimbursements(range.startDate, range.endDate, department),
        Expense.aggregate([
            { $match: expenseFilter },
            {
                $group: {
                    _id: { $month: '$date' },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]),
        calculationService.getCategoryExpenses(range.startDate, range.endDate),
        calculationService.getDepartmentExpenses(range.startDate, range.endDate)
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            period: range,
            summary: {
                totalExpenses,
                totalPayroll,
                totalReimbursements,
                operationalExpenses: totalExpenses + totalPayroll + totalReimbursements
            },
            monthlyBreakdown,
            categoryBreakdown,
            departmentBreakdown
        }
    });
});

exports.getDepartmentSpending = catchAsync(async (req, res, next) => {
    const { year, month } = req.query;
    if (!year) {
        return next(new AppError('Year is required', 400));
    }

    const range = parseYearMonth(year, month);

    const departmentSpending = await Expense.aggregate([
        {
            $match: {
                date: { $gte: range.startDate, $lte: range.endDate },
                status: EXPENSE_STATUS.APPROVED
            }
        },
        {
            $group: {
                _id: '$department',
                totalExpenses: { $sum: '$amount' },
                transactionCount: { $sum: 1 },
                avgExpense: { $avg: '$amount' }
            }
        },
        { $sort: { totalExpenses: -1 } }
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            period: range,
            departmentSpending
        }
    });
});

exports.getProfitLoss = catchAsync(async (req, res, next) => {
    const { year, month, totalSales, totalRevenue, rawMaterialCosts = 0 } = req.query;

    if (!year) {
        return next(new AppError('Year is required', 400));
    }

    const parsedRevenue = Number(totalSales ?? totalRevenue);
    const parsedRawMaterialCosts = Number(rawMaterialCosts);

    if (Number.isNaN(parsedRevenue) || parsedRevenue < 0) {
        return next(new AppError('totalSales or totalRevenue must be a valid non-negative number', 400));
    }

    if (Number.isNaN(parsedRawMaterialCosts) || parsedRawMaterialCosts < 0) {
        return next(new AppError('rawMaterialCosts must be a valid non-negative number', 400));
    }

    const range = parseYearMonth(year, month);
    const financials = await calculationService.calculateNetProfit(
        range.startDate,
        range.endDate,
        parsedRevenue
    );

    const operationalExpenses = financials.totalExpenses + financials.totalPayroll + financials.totalReimbursements;
    const netProfit = parsedRevenue - (parsedRawMaterialCosts + operationalExpenses);

    res.status(200).json({
        status: 'success',
        data: {
            period: range,
            totalRevenue: parsedRevenue,
            totalExpenses: financials.totalExpenses,
            totalPayroll: financials.totalPayroll,
            totalReimbursements: financials.totalReimbursements,
            rawMaterialCosts: parsedRawMaterialCosts,
            operationalExpenses,
            netProfit,
            profitMargin: parsedRevenue > 0 ? Number(((netProfit / parsedRevenue) * 100).toFixed(2)) : 0
        }
    });
});

exports.getExpenseAnalytics = catchAsync(async (req, res, next) => {
    const { year, month } = req.query;
    if (!year) {
        return next(new AppError('Year is required for analytics', 400));
    }

    const range = parseYearMonth(year, month);
    const matchStage = {
        date: { $gte: range.startDate, $lte: range.endDate },
        status: EXPENSE_STATUS.APPROVED
    };

    const [topVendors, topCategories, byPaymentMethod] = await Promise.all([
        Expense.aggregate([
            { $match: { ...matchStage, vendor: { $ne: null } } },
            {
                $group: {
                    _id: '$vendor',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: 'vendors',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'vendorInfo'
                }
            },
            {
                $project: {
                    vendor: { $arrayElemAt: ['$vendorInfo.name', 0] },
                    totalAmount: 1,
                    count: 1
                }
            }
        ]),
        calculationService.getCategoryExpenses(range.startDate, range.endDate),
        Expense.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$paymentMethod',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } }
        ])
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            period: range,
            topVendors,
            topCategories,
            byPaymentMethod
        }
    });
});

exports.exportReportCsv = catchAsync(async (req, res, next) => {
    const { year, month, department, category } = req.query;
    if (!year) {
        return next(new AppError('Year is required for export', 400));
    }

    const range = parseYearMonth(year, month);
    const expenseFilter = buildExpenseFilter({
        ...range,
        department,
        category
    });

    const expenses = await Expense.find(expenseFilter)
        .populate('category', 'name')
        .populate('subCategory', 'name')
        .populate('vendor', 'name')
        .sort('-date')
        .lean();

    const headers = [
        'Date',
        'Title',
        'Amount',
        'Category',
        'SubCategory',
        'Department',
        'Vendor',
        'PaymentMethod',
        'Status'
    ];

    const rows = expenses.map((item) => ({
        Date: new Date(item.date).toISOString().split('T')[0],
        Title: item.title,
        Amount: item.amount,
        Category: item.category?.name || '',
        SubCategory: item.subCategory?.name || '',
        Department: item.department,
        Vendor: item.vendor?.name || '',
        PaymentMethod: item.paymentMethod,
        Status: item.status
    }));

    const csv = toCsv(headers, rows);
    const fileName = `expense-report-${range.year}${range.month ? `-${range.month}` : ''}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    res.send(csv);
});

exports.exportReportJson = catchAsync(async (req, res, next) => {
    const { year, month, department, category } = req.query;
    if (!year) {
        return next(new AppError('Year is required for export', 400));
    }

    const range = parseYearMonth(year, month);
    const expenseFilter = buildExpenseFilter({
        ...range,
        department,
        category
    });

    const expenses = await Expense.find(expenseFilter)
        .populate('category', 'name')
        .populate('subCategory', 'name')
        .populate('vendor', 'name')
        .populate('createdBy', 'name email role')
        .sort('-date');

    res.status(200).json({
        status: 'success',
        data: {
            period: range,
            filters: { department, category },
            results: expenses.length,
            expenses
        }
    });
});

// Backward compatible aliases
exports.getMonthlyReport = exports.getMonthlyExpenseReport;
exports.getYearlyReport = exports.getYearlyExpenseReport;
exports.getProfitLossReport = exports.getProfitLoss;
exports.exportReport = exports.exportReportCsv;