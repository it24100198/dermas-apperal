const { validationResult } = require('express-validator');

exports.validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = {};
    errors.array().forEach(err => {
      const field = err.path || err.param || 'unknown';
      if (!extractedErrors[field]) {
        extractedErrors[field] = [];
      }
      extractedErrors[field].push(err.msg);
    });

    return res.status(400).json({
      success: false,
      errors: extractedErrors
    });
  };
};