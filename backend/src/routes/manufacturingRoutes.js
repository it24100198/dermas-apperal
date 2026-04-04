import { Router } from 'express';
import * as manufacturingController from '../controllers/manufacturingController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireWashingSupervisor } from '../middleware/supervisor.js';
import { validate } from '../middleware/validate.js';
import { cuttingSchema } from '../validators/jobs.js';
import { createTransferSchema } from '../validators/washing.js';
import { saveQcSchema, issueAccessorySchema } from '../validators/qc.js';

const router = Router();

router.use(requireAuth);

// Overview
router.get('/overview', manufacturingController.getOverview);

// Cutting
router.get('/cutting', manufacturingController.listCutting);
router.post('/cutting/:jobId', validate(cuttingSchema), manufacturingController.saveCutting);

// Washing
router.get('/washing', manufacturingController.getWashing);
router.post('/washing/transfers', validate(createTransferSchema), manufacturingController.createTransfer);
router.post('/washing/transfers/:id/receive', requireWashingSupervisor, manufacturingController.receiveTransfer);
router.post('/washing/transfers/:id/complete', requireWashingSupervisor, manufacturingController.completeWashing);

// QC
router.get('/qc', manufacturingController.listQc);
router.get('/qc/:transferId', manufacturingController.getQcDetail);
router.post('/qc/:transferId', validate(saveQcSchema), manufacturingController.saveQc);
router.post('/qc/batches/:batchId/accessories', validate(issueAccessorySchema), manufacturingController.issueAccessory);
router.post('/qc/batches/:batchId/send-to-final', manufacturingController.sendToFinalCheck);

// Final checking
router.get('/final', manufacturingController.listFinal);
router.get('/final/:jobId', manufacturingController.getFinalJobDetail);
router.post('/final/batches/:batchId/finalize', manufacturingController.finalizeBatch);

export default router;
