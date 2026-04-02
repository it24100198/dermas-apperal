import { Router } from 'express';
import * as productionController from '../controllers/productionController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { hourlyProductionSchema } from '../validators/production.js';

const router = Router();

router.use(requireAuth);

router.get('/hourly', productionController.listHourly);
router.get('/hourly/:jobId', productionController.getHourlyRecords);
router.post('/hourly', validate(hourlyProductionSchema), productionController.saveHourly);

export default router;
