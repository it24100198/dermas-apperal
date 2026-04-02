import { Router } from 'express';
import ReimbursementClaim from '../models/ReimbursementClaim.js';

const router = Router();

// GET /api/reimbursements?status=pending
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const claims = await ReimbursementClaim.find(filter)
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (err) { next(err); }
});

// POST /api/reimbursements  – employee submits claim
router.post('/', async (req, res, next) => {
  try {
    const claim = await ReimbursementClaim.create(req.body);
    res.status(201).json(claim);
  } catch (err) { next(err); }
});

// PUT /api/reimbursements/:id/approve
router.put('/:id/approve', async (req, res, next) => {
  try {
    const claim = await ReimbursementClaim.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        reviewNote: req.body.reviewNote || '',
        reviewedBy: req.body.reviewedBy || null,
        reviewedAt: new Date(),
      },
      { new: true }
    );
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) { next(err); }
});

// PUT /api/reimbursements/:id/reject
router.put('/:id/reject', async (req, res, next) => {
  try {
    const claim = await ReimbursementClaim.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        reviewNote: req.body.reviewNote || '',
        reviewedBy: req.body.reviewedBy || null,
        reviewedAt: new Date(),
      },
      { new: true }
    );
    if (!claim) return res.status(404).json({ error: 'Claim not found' });
    res.json(claim);
  } catch (err) { next(err); }
});

// DELETE /api/reimbursements/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await ReimbursementClaim.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
