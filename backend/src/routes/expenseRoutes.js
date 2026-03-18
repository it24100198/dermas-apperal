const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { canApprove, isAccountant, isAdmin } = require('../middleware/roleCheck');
const upload = require('../config/multer');
const { validate, expenseValidationRules } = require('../utils/validators');
const { logAction } = require('../middleware/auditLogger');

// All routes require authentication
router.use(protect);

// Stats route - specific before /:id routes
router.get('/stats', isAccountant, expenseController.getExpenseStats);

// CRUD operations
router.route('/')
    .get(expenseController.getAllExpenses)
    .post(
        upload.single('receipt'),
        expenseValidationRules(),
        validate,
        logAction('CREATE', 'EXPENSE'),
        expenseController.createExpense
    );

router.post('/bulk', isAdmin, expenseController.bulkCreateExpenses);
router.patch(
    '/:id/comments',
    logAction('UPDATE', 'EXPENSE'),
    expenseController.addExpenseComment
);

router.route('/:id')
    .get(expenseController.getExpense)
    .patch(
        upload.single('receipt'),
        logAction('UPDATE', 'EXPENSE'),
        expenseController.updateExpense
    )
    .delete(isAdmin, logAction('DELETE', 'EXPENSE'), expenseController.deleteExpense);

// Approval routes
router.patch('/:id/approve', 
    canApprove, 
    logAction('APPROVE', 'EXPENSE'),
    expenseController.approveExpense
);

router.patch('/:id/reject', 
    canApprove, 
    logAction('REJECT', 'EXPENSE'),
    expenseController.rejectExpense
);

module.exports = router;