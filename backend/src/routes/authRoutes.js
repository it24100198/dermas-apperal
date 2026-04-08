import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
	approveRegistrationSchema,
	forgotPasswordSchema,
	loginSchema,
	registrationStatusLookupSchema,
	registerRequestSchema,
	resetPasswordSchema,
	rejectRegistrationSchema,
} from '../validators/auth.js';

const router = Router();

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerRequestSchema), authController.register);
router.post('/register-request', validate(registerRequestSchema), authController.createRegistrationRequest);
router.get('/registration-requests/status', validate(registrationStatusLookupSchema, 'query'), authController.lookupRegistrationRequestStatus);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', requireAuth, authController.me);

router.get('/registration-requests', requireAuth, requireRole('admin'), authController.listRegistrationRequests);
router.get('/registration-requests/:id', requireAuth, requireRole('admin'), authController.getRegistrationRequestDetail);
router.post(
	'/registration-requests/:id/approve',
	requireAuth,
	requireRole('admin'),
	validate(approveRegistrationSchema),
	authController.approveRegistrationRequest
);
router.post(
	'/registration-requests/:id/reject',
	requireAuth,
	requireRole('admin'),
	validate(rejectRegistrationSchema),
	authController.rejectRegistrationRequest
);

export default router;
