const Expense = require('../models/Expense');
const Reimbursement = require('../models/Reimbursement');
const Employee = require('../models/Employee');
const PettyCash = require('../models/PettyCash');
const catchAsync = require('../utils/catchAsync');
const { EXPENSE_STATUS } = require('../config/constants');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
exports.getDashboardStats = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  // Get total expenses this month
  const totalExpensesThisMonth = await Expense.aggregate([
    {
      $match: {
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: EXPENSE_STATUS.APPROVED
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  // Get pending approvals
  const pendingApprovals = await Expense.countDocuments({
    status: EXPENSE_STATUS.PENDING
  });

  // Get petty cash balance
  const lastPettyCash = await PettyCash.findOne().sort('-transactionDate');
  const pettyCashBalance = lastPettyCash ? lastPettyCash.balance : 0;

  // Get pending reimbursements
  const pendingReimbursements = await Reimbursement.countDocuments({
    status: EXPENSE_STATUS.PENDING
  });

  // Get monthly trend for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const monthlyTrend = await Expense.aggregate([
    {
      $match: {
        date: { $gte: sixMonthsAgo },
        status: EXPENSE_STATUS.APPROVED
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        total: { $sum: '$amount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        month: {
          $concat: [
            { $toString: '$_id.year' },
            '-',
            { $toString: '$_id.month' }
          ]
        },
        total: 1
      }
    }
  ]);

  // Get top spending categories
  const topCategories = await Expense.aggregate([
    {
      $match: {
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: EXPENSE_STATUS.APPROVED
      }
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' }
      }
    },
    { $sort: { total: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'expensecategories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $project: {
        category: { $arrayElemAt: ['$categoryInfo.name', 0] },
        total: 1
      }
    }
  ]);

  // Get recent expenses
  const recentExpenses = await Expense.find()
    .sort('-createdAt')
    .limit(5)
    .populate('category', 'name')
    .populate('createdBy', 'name');

  res.status(200).json({
    success: true,
    data: {
      summary: {
        totalExpensesThisMonth: totalExpensesThisMonth[0]?.total || 0,
        pendingApprovals,
        pettyCashBalance,
        pendingReimbursements
      },
      monthlyTrend,
      topCategories,
      recentExpenses
    }
  });
});

// @desc    Get department wise stats
// @route   GET /api/dashboard/department-stats
// @access  Private (Admin, Manager)
exports.getDepartmentStats = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const departmentStats = await Expense.aggregate([
    {
      $match: {
        date: { $gte: startOfMonth, $lte: endOfMonth },
        status: EXPENSE_STATUS.APPROVED
      }
    },
    {
      $group: {
        _id: '$department',
        totalExpenses: { $sum: '$amount' },
        expenseCount: { $sum: 1 },
        averageExpense: { $avg: '$amount' }
      }
    },
    {
      $lookup: {
        from: 'employees',
        let: { department: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$department', '$$department'] }
            }
          },
          {
            $group: {
              _id: null,
              employeeCount: { $sum: 1 },
              totalSalary: { $sum: '$salary' }
            }
          }
        ],
        as: 'employeeStats'
      }
    },
    {
      $project: {
        department: '$_id',
        totalExpenses: 1,
        expenseCount: 1,
        averageExpense: 1,
        employeeCount: { $arrayElemAt: ['$employeeStats.employeeCount', 0] },
        totalPayroll: { $arrayElemAt: ['$employeeStats.totalSalary', 0] }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: departmentStats
  });
});