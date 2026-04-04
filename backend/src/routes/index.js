import { Router } from 'express';
import authRoutes from './authRoutes.js';
import jobRoutes from './jobRoutes.js';
import manufacturingRoutes from './manufacturingRoutes.js';
import productionRoutes from './productionRoutes.js';
import supervisorRoutes from './supervisorRoutes.js';
import metaRoutes from './metaRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import reimbursementRoutes from './reimbursementRoutes.js';
import purchaseRoutes from './purchaseRoutes.js';
import stockRoutes from './stockRoutes.js';
import salesRoutes from './salesRoutes.js';
import aiRoutes from './aiRoutes.js';
import productRoutes from './productRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/manufacturing', manufacturingRoutes);
router.use('/production', productionRoutes);
router.use('/supervisor', supervisorRoutes);
router.use('/meta', metaRoutes);
router.use('/expenses', expenseRoutes);
router.use('/reimbursements', reimbursementRoutes);
router.use('/purchase', purchaseRoutes);
router.use('/stock', stockRoutes);
router.use('/sales', salesRoutes);
router.use('/ai', aiRoutes);
router.use('/products', productRoutes);

export default router;
