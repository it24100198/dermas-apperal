const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');
const { EXPENSE_STATUS } = require('../config/constants');

class RecurringExpenseService {
    calculateNextDueDate(fromDate, frequency) {
        const baseDate = new Date(fromDate);
        const nextDate = new Date(baseDate);

        switch (frequency) {
            case 'monthly':
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            case 'quarterly':
                nextDate.setMonth(nextDate.getMonth() + 3);
                break;
            case 'yearly':
                nextDate.setFullYear(nextDate.getFullYear() + 1);
                break;
            default:
                throw new Error('Invalid recurring frequency');
        }

        return nextDate;
    }

    // Process recurring expenses - should be called by a cron job
    async processRecurringExpenses() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Find all active recurring expenses that are due
        const recurringExpenses = await RecurringExpense.find({
            status: 'active',
            nextDueDate: { $lte: today }
        });
        
        const results = {
            processed: 0,
            failed: 0,
            errors: []
        };
        
        for (const recurringExp of recurringExpenses) {
            try {
                await this.generateExpense(recurringExp);
                results.processed++;
            } catch (error) {
                results.failed++;
                results.errors.push({
                    recurringExpenseId: recurringExp._id,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    // Generate expense from recurring expense
    async generateExpense(recurringExpense) {
        // Check if end date reached
        if (recurringExpense.endDate && recurringExpense.endDate < new Date()) {
            recurringExpense.status = 'completed';
            await recurringExpense.save();
            return;
        }
        
        // Create expense from recurring template
        const expense = await Expense.create({
            title: recurringExpense.title,
            description: recurringExpense.description,
            amount: recurringExpense.amount,
            category: recurringExpense.category,
            subCategory: recurringExpense.subCategory,
            vendor: recurringExpense.vendor,
            department: recurringExpense.department,
            paymentMethod: recurringExpense.paymentMethod,
            date: new Date(),
            status: recurringExpense.autoApprove ? EXPENSE_STATUS.APPROVED : EXPENSE_STATUS.PENDING,
            isRecurring: true,
            recurringExpenseId: recurringExpense._id,
            createdBy: recurringExpense.createdBy
        });
        
        // Update recurring expense
        recurringExpense.lastGeneratedDate = new Date();
        recurringExpense.nextDueDate = recurringExpense.calculateNextDueDate();
        recurringExpense.createdExpenses.push(expense._id);
        
        // Check if we should complete the recurring expense
        if (recurringExpense.endDate && recurringExpense.nextDueDate > recurringExpense.endDate) {
            recurringExpense.status = 'completed';
        }
        
        await recurringExpense.save();
        
        return expense;
    }
    
    // Get upcoming recurring expenses
    async getUpcomingRecurringExpenses(days = 30) {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        const recurringExpenses = await RecurringExpense.find({
            status: 'active',
            nextDueDate: { $gte: today, $lte: futureDate }
        }).populate('category', 'name')
          .populate('vendor', 'name');
        
        return recurringExpenses;
    }
    
    // Pause recurring expense
    async pauseRecurringExpense(id) {
        const recurringExpense = await RecurringExpense.findById(id);
        
        if (!recurringExpense) {
            throw new Error('Recurring expense not found');
        }
        
        recurringExpense.status = 'paused';
        await recurringExpense.save();
        
        return recurringExpense;
    }
    
    // Resume recurring expense
    async resumeRecurringExpense(id) {
        const recurringExpense = await RecurringExpense.findById(id);
        
        if (!recurringExpense) {
            throw new Error('Recurring expense not found');
        }
        
        recurringExpense.status = 'active';
        
        // Recalculate next due date if needed
        if (!recurringExpense.nextDueDate || recurringExpense.nextDueDate < new Date()) {
            recurringExpense.nextDueDate = recurringExpense.calculateNextDueDate();
        }
        
        await recurringExpense.save();
        
        return recurringExpense;
    }
}

module.exports = new RecurringExpenseService();