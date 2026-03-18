const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const { canApprove, isAccountant } = require('../middleware/roleCheck');
const { validate } = require('../middleware/validate');
const upload = require('../config/multer');
const {
  submitClaim,
  getAllReimbursements,
  getReimbursement,
  updateReimbursementStatus,
  markAsPaid,
  getReimbursementSummary
} = require('../controllers/reimbursementController');

// Validation rules
const claimValidation = [
  body('expenseTitle').notEmpty().withMessage('Expense title is required'),
  body('category')
    .isIn(['travel', 'meals', 'field_expenses', 'office_supplies', 'other'])
    .withMessage('Valid category is required'),
  body('amount').isNumeric().withMessage('Amount must be a number')
    .custom(value => value > 0).withMessage('Amount must be greater than 0'),
  body('description').notEmpty().withMessage('Description is required'),
  body('expenseDate').optional().isISO8601().withMessage('Valid expenseDate is required')
];

// Routes
router.route('/')
  .get(protect, getAllReimbursements)
  .post(protect, upload.single('receipt'), validate(claimValidation), submitClaim);

router.get('/summary', protect, getReimbursementSummary);

router.route('/:id')
  .get(protect, getReimbursement);

router.patch('/:id/status', protect, canApprove, updateReimbursementStatus);
router.patch('/:id/paid', protect, isAccountant, markAsPaid);

module.exports = router;