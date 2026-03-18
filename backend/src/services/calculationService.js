const Expense = require('../models/Expense');
const Employee = require('../models/Employee');
const Reimbursement = require('../models/Reimbursement');

class CalculationService {
    // Calculate total expenses for a period
    async calculateTotalExpenses(startDate, endDate, department = null) {
        const filter = {
            date: { $gte: startDate, $lte: endDate },
            status: 'approved'
        };
        
        if (department) {
            filter.department = department;
        }
        
        const result = await Expense.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        
        return result.length > 0 ? result[0].total : 0;
    }
    
    // Calculate payroll for a period
    async calculatePayroll(startDate, endDate, department = null) {
        const filter = {};
        
        if (department) {
            filter.department = department;
        }
        
        // Get all active employees
        const employees = await Employee.find({ 
            ...filter,
            status: 'active',
            joiningDate: { $lte: endDate }
        });
        
        // Calculate total salary for the period
        // This is simplified - in reality you'd need to handle:
        // - Partial months for new hires
        // - Leaves without pay
        // - Bonuses, deductions etc.
        const months = this.getMonthsBetween(startDate, endDate);
        const totalPayroll = employees.reduce((sum, emp) => sum + (emp.salary * months), 0);
        
        return totalPayroll;
    }
    
    // Calculate reimbursements for a period
    async calculateReimbursements(startDate, endDate, department = null) {
        const filter = {
            expenseDate: { $gte: startDate, $lte: endDate },
            status: 'approved'
        };
        
        if (department) {
            // Join with employees to filter by department
            const employees = await Employee.find({ department }).distinct('_id');
            filter.employeeId = { $in: employees };
        }
        
        const result = await Reimbursement.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]);
        
        return result.length > 0 ? result[0].total : 0;
    }
    
    // Calculate net profit
    async calculateNetProfit(startDate, endDate, revenue) {
        const [totalExpenses, totalPayroll, totalReimbursements] = await Promise.all([
            this.calculateTotalExpenses(startDate, endDate),
            this.calculatePayroll(startDate, endDate),
            this.calculateReimbursements(startDate, endDate)
        ]);
        
        const operationalExpenses = totalExpenses + totalPayroll + totalReimbursements;
        const netProfit = revenue - operationalExpenses;
        
        return {
            revenue,
            totalExpenses,
            totalPayroll,
            totalReimbursements,
            operationalExpenses,
            netProfit,
            profitMargin: revenue > 0 ? (netProfit / revenue) * 100 : 0
        };
    }
    
    // Helper to get number of months between two dates
    getMonthsBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        let months = (end.getFullYear() - start.getFullYear()) * 12;
        months -= start.getMonth();
        months += end.getMonth();
        
        return months <= 0 ? 1 : months;
    }
    
    // Get department-wise expense breakdown
    async getDepartmentExpenses(startDate, endDate) {
        const filter = {
            date: { $gte: startDate, $lte: endDate },
            status: 'approved'
        };
        
        const result = await Expense.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$department',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { total: -1 } }
        ]);
        
        return result;
    }
    
    // Get category-wise expense breakdown
    async getCategoryExpenses(startDate, endDate) {
        const filter = {
            date: { $gte: startDate, $lte: endDate },
            status: 'approved'
        };
        
        const result = await Expense.aggregate([
            { $match: filter },
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
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $project: {
                    categoryName: '$categoryInfo.name',
                    categoryType: '$categoryInfo.type',
                    total: 1,
                    count: 1
                }
            },
            { $sort: { total: -1 } }
        ]);
        
        return result;
    }
}

module.exports = new CalculationService();