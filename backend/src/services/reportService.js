const Expense = require('../models/Expense');
const Employee = require('../models/Employee');

const generateMonthlyReport = async (year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const expenses = await Expense.find({
    date: { $gte: startDate, $lte: endDate },
    status: 'Approved'
  }).populate('category');

  // Group by category
  const byCategory = {};
  expenses.forEach(exp => {
    const catName = exp.category?.name || 'Uncategorized';
    if (!byCategory[catName]) {
      byCategory[catName] = {
        total: 0,
        count: 0,
        items: []
      };
    }
    byCategory[catName].total += exp.amount;
    byCategory[catName].count += 1;
    byCategory[catName].items.push(exp);
  });

  // Group by department
  const byDepartment = {};
  expenses.forEach(exp => {
    if (!byDepartment[exp.department]) {
      byDepartment[exp.department] = {
        total: 0,
        count: 0
      };
    }
    byDepartment[exp.department].total += exp.amount;
    byDepartment[exp.department].count += 1;
  });

  return {
    period: { year, month },
    summary: {
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      totalTransactions: expenses.length,
      averageExpense: expenses.length ? expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length : 0
    },
    byCategory,
    byDepartment
  };
};

const generateYearlyTrend = async (year) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);

  const monthlyData = await Expense.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: 'Approved'
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          category: '$category'
        },
        total: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: '$_id.month',
        categories: {
          $push: {
            category: '$_id.category',
            total: '$total'
          }
        },
        monthlyTotal: { $sum: '$total' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  return {
    year,
    monthlyData
  };
};

module.exports = {
  generateMonthlyReport,
  generateYearlyTrend
};