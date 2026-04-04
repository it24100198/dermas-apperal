import { Router } from 'express';
import ExpenseCategory from '../models/ExpenseCategory.js';
import Expense from '../models/Expense.js';

const router = Router();

// ── Categories ────────────────────────────────────────────
// GET /api/expenses/categories
router.get('/categories', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.parentOnly === 'true') filter.parentCategory = null;
    const categories = await ExpenseCategory.find(filter)
      .populate('parentCategory', 'name')
      .sort({ name: 1 });
    res.json(categories);
  } catch (err) { next(err); }
});

// POST /api/expenses/categories
router.post('/categories', async (req, res, next) => {
  try {
    const category = await ExpenseCategory.create(req.body);
    res.status(201).json(category);
  } catch (err) { next(err); }
});

// PUT /api/expenses/categories/:id
router.put('/categories/:id', async (req, res, next) => {
  try {
    const category = await ExpenseCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (err) { next(err); }
});

// DELETE /api/expenses/categories/:id
router.delete('/categories/:id', async (req, res, next) => {
  try {
    await ExpenseCategory.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── Summary / P&L ─────────────────────────────────────────
// GET /api/expenses/summary?year=2025
router.get('/summary', async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const start = new Date(`${year}-01-01`);
    const end   = new Date(`${year + 1}-01-01`);

    const monthly = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, category: '$category' },
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'expensecategories',
          localField: '_id.category',
          foreignField: '_id',
          as: 'cat',
        },
      },
      { $unwind: { path: '$cat', preserveNullAndEmpty: true } },
      {
        $project: {
          month: '$_id.month',
          categoryName: { $ifNull: ['$cat.name', 'Unknown'] },
          categoryType: { $ifNull: ['$cat.type', 'other'] },
          total: 1,
        },
      },
      { $sort: { month: 1 } },
    ]);

    const totals = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({ monthly, yearTotal: totals[0]?.total || 0 });
  } catch (err) { next(err); }
});

// GET /api/expenses/recurring
router.get('/recurring', async (req, res, next) => {
  try {
    const categories = await ExpenseCategory.find({ isRecurring: true }).sort({ name: 1 });
    res.json(categories);
  } catch (err) { next(err); }
});

// ── Expenses CRUD ─────────────────────────────────────────
// GET /api/expenses
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
    if (req.query.isPettyCash) filter.isPettyCash = req.query.isPettyCash === 'true';
    if (req.query.month && req.query.year) {
      const y = parseInt(req.query.year);
      const m = parseInt(req.query.month) - 1;
      filter.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    }
    const expenses = await Expense.find(filter)
      .populate('category', 'name type')
      .sort({ date: -1 })
      .limit(200);
    res.json(expenses);
  } catch (err) { next(err); }
});

// POST /api/expenses
router.post('/', async (req, res, next) => {
  try {
    const expense = await Expense.create(req.body);
    const populated = await expense.populate('category', 'name type');
    res.status(201).json(populated);
  } catch (err) { next(err); }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('category', 'name type');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (err) { next(err); }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
