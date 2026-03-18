const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdminOrManager, isAccountant } = require('../middleware/roleCheck');
const {
  createRecurringExpense,
  getAllRecurringExpenses,
  getRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  pauseRecurringExpense,
  resumeRecurringExpense,
  generateRecurringExpenses
} = require('../controllers/recurringExpenseController');

router.route('/')
  .get(protect, getAllRecurringExpenses)
  .post(protect, isAccountant, createRecurringExpense);

router.post('/generate', protect, isAdminOrManager, generateRecurringExpenses);

router.route('/:id')
  .get(protect, getRecurringExpense)
  .patch(protect, isAccountant, updateRecurringExpense)
  .delete(protect, isAdminOrManager, deleteRecurringExpense);

router.patch('/:id/pause', protect, isAccountant, pauseRecurringExpense);
router.patch('/:id/resume', protect, isAccountant, resumeRecurringExpense);

module.exports = router;