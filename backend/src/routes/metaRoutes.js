import { Router } from 'express';
import { Material, Product, Employee, ProductionSection } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/materials', async (req, res, next) => {
  try {
    const materials = await Material.find().sort({ name: 1 }).lean();
    res.json(materials);
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const products = await Product.find({ classification: 'normal' }).sort({ name: 1 }).lean();
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get('/employees', async (req, res, next) => {
  try {
    const employees = await Employee.find().populate('productionSectionId', 'name slug').sort({ name: 1 }).lean();
    res.json(employees);
  } catch (err) {
    next(err);
  }
});

router.get('/sections', async (req, res, next) => {
  try {
    const type = req.query.type;
    const query = type ? { type, isActive: true } : { isActive: true };
    const sections = await ProductionSection.find(query).sort({ name: 1 }).lean();
    res.json(sections);
  } catch (err) {
    next(err);
  }
});

export default router;
