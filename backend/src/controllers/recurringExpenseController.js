const RecurringExpense = require('../models/RecurringExpense');
const AuditLog = require('../models/AuditLog');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const recurringExpenseService = require('../services/recurringExpenseService');

const sanitizeRecurringPayload = (payload = {}) => {
  const sanitized = { ...payload };
  const objectIdOptionalFields = ['subCategory', 'vendor'];
  const optionalDateFields = ['endDate'];

  objectIdOptionalFields.forEach((field) => {
    if (sanitized[field] === '' || sanitized[field] === null) {
      delete sanitized[field];
    }
  });

  optionalDateFields.forEach((field) => {
    if (sanitized[field] === '') {
      delete sanitized[field];
    }
  });

  return sanitized;
};

const createAudit = async ({ req, action, documentId, changes }) => {
  try {
    await AuditLog.create({
      user: req.user._id,
      action,
      module: 'RECURRING',
      documentId,
      documentModel: 'RecurringExpense',
      changes,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Recurring audit log creation failed:', error.message);
  }
};

// @desc    Create recurring expense
// @route   POST /api/recurring-expenses
// @access  Private (Accountant, Admin)
exports.createRecurringExpense = catchAsync(async (req, res, next) => {
  req.body = sanitizeRecurringPayload(req.body);
  req.body.createdBy = req.user._id;
  
  // Calculate next due date
  const startDate = new Date(req.body.startDate);
  if (Number.isNaN(startDate.getTime())) {
    return next(new AppError('Valid startDate is required', 400));
  }

  req.body.nextDueDate = recurringExpenseService.calculateNextDueDate(
    startDate,
    req.body.frequency
  );

  const recurringExpense = await RecurringExpense.create(req.body);

  // Create audit log
  await createAudit({
    req,
    action: 'CREATE',
    documentId: recurringExpense._id,
    changes: { after: recurringExpense.toObject() }
  });

  res.status(201).json({
    success: true,
    data: recurringExpense
  });
});

// @desc    Get all recurring expenses
// @route   GET /api/recurring-expenses
// @access  Private
exports.getAllRecurringExpenses = catchAsync(async (req, res, next) => {
  const { status, department, frequency } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (department) filter.department = department;
  if (frequency) filter.frequency = frequency;

  const recurringExpenses = await RecurringExpense.find(filter)
    .populate('category', 'name')
    .populate('subCategory', 'name')
    .populate('vendor', 'name')
    .populate('createdBy', 'name');

  res.status(200).json({
    success: true,
    count: recurringExpenses.length,
    data: recurringExpenses
  });
});

// @desc    Get single recurring expense
// @route   GET /api/recurring-expenses/:id
// @access  Private
exports.getRecurringExpense = catchAsync(async (req, res, next) => {
  const recurringExpense = await RecurringExpense.findById(req.params.id)
    .populate('category', 'name')
    .populate('subCategory', 'name')
    .populate('vendor', 'name')
    .populate('createdBy', 'name');

  if (!recurringExpense) {
    return next(new AppError('No recurring expense found with that ID', 404));
  }

  res.status(200).json({
    success: true,
    data: recurringExpense
  });
});

// @desc    Update recurring expense
// @route   PATCH /api/recurring-expenses/:id
// @access  Private (Accountant, Admin)
exports.updateRecurringExpense = catchAsync(async (req, res, next) => {
  req.body = sanitizeRecurringPayload(req.body);

  const recurringExpense = await RecurringExpense.findById(req.params.id);

  if (!recurringExpense) {
    return next(new AppError('No recurring expense found with that ID', 404));
  }

  // Store old data for audit
  const oldData = recurringExpense.toObject();

  // Update next due date if frequency or start date changed
  if (req.body.frequency || req.body.startDate) {
    const startDate = req.body.startDate ? new Date(req.body.startDate) : recurringExpense.startDate;
    req.body.nextDueDate = recurringExpenseService.calculateNextDueDate(
      startDate,
      req.body.frequency || recurringExpense.frequency
    );
  }

  const updated = await RecurringExpense.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  // Create audit log
  await createAudit({
    req,
    action: 'UPDATE',
    documentId: recurringExpense._id,
    changes: {
      before: oldData,
      after: updated?.toObject ? updated.toObject() : updated
    }
  });

  res.status(200).json({
    success: true,
    data: updated
  });
});

// @desc    Delete recurring expense
// @route   DELETE /api/recurring-expenses/:id
// @access  Private (Admin only)
exports.deleteRecurringExpense = catchAsync(async (req, res, next) => {
  const recurringExpense = await RecurringExpense.findById(req.params.id);

  if (!recurringExpense) {
    return next(new AppError('No recurring expense found with that ID', 404));
  }

  const expenseData = recurringExpense.toObject();
  await RecurringExpense.findByIdAndDelete(req.params.id);

  // Create audit log
  await createAudit({
    req,
    action: 'DELETE',
    documentId: req.params.id,
    changes: { before: expenseData }
  });

  res.status(200).json({
    success: true,
    message: 'Recurring expense deleted successfully'
  });
});

// @desc    Pause recurring expense
// @route   PATCH /api/recurring-expenses/:id/pause
// @access  Private (Accountant, Admin)
exports.pauseRecurringExpense = catchAsync(async (req, res, next) => {
  const recurringExpense = await RecurringExpense.findById(req.params.id);

  if (!recurringExpense) {
    return next(new AppError('No recurring expense found with that ID', 404));
  }

  recurringExpense.status = 'paused';
  await recurringExpense.save();

  res.status(200).json({
    success: true,
    data: recurringExpense
  });
});

// @desc    Resume recurring expense
// @route   PATCH /api/recurring-expenses/:id/resume
// @access  Private (Accountant, Admin)
exports.resumeRecurringExpense = catchAsync(async (req, res, next) => {
  const recurringExpense = await RecurringExpense.findById(req.params.id);

  if (!recurringExpense) {
    return next(new AppError('No recurring expense found with that ID', 404));
  }

  recurringExpense.status = 'active';

  if (!recurringExpense.nextDueDate || recurringExpense.nextDueDate < new Date()) {
    recurringExpense.nextDueDate = recurringExpenseService.calculateNextDueDate(
      new Date(),
      recurringExpense.frequency
    );
  }

  await recurringExpense.save();

  res.status(200).json({
    success: true,
    data: recurringExpense
  });
});

// @desc    Generate expenses from recurring
// @route   POST /api/recurring-expenses/generate
// @access  Private (Admin only) - Can be called by cron job
exports.generateRecurringExpenses = catchAsync(async (req, res, next) => {
  const generationResult = await recurringExpenseService.processRecurringExpenses();

  res.status(200).json({
    success: true,
    message: `Generated ${generationResult.processed} expenses from recurring entries`,
    data: generationResult
  });
});