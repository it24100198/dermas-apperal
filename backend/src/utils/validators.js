const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push({ [err.path || err.param || 'unknown']: err.msg }));
    
    return res.status(422).json({
        status: 'fail',
        errors: extractedErrors
    });
};

const expenseValidationRules = () => {
    return [
        body('title').notEmpty().withMessage('Title is required'),
        body('amount').isNumeric().withMessage('Amount must be a number')
            .custom(value => value > 0).withMessage('Amount must be greater than 0'),
        body('category').notEmpty().withMessage('Category is required'),
        body('paymentMethod').isIn(['cash', 'bank_transfer', 'credit_card'])
            .withMessage('Invalid payment method'),
        body('date').isISO8601().withMessage('Invalid date format')
    ];
};

const reimbursementValidationRules = () => {
    return [
        body('expenseTitle').notEmpty().withMessage('Expense title is required'),
        body('amount').isNumeric().withMessage('Amount must be a number')
            .custom(value => value > 0).withMessage('Amount must be greater than 0'),
        body('description').notEmpty().withMessage('Description is required')
    ];
};

module.exports = {
    validate,
    expenseValidationRules,
    reimbursementValidationRules
};