import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  getMyAccountSettings,
  updatePassword,
  updatePreferences,
  updateProfile,
} from '../controllers/accountSettingsController.js';
import {
  updateAccountPasswordSchema,
  updateAccountPreferencesSchema,
  updateAccountProfileSchema,
} from '../validators/accountSettings.js';

const router = Router();

router.use(requireAuth);

router.get('/me', getMyAccountSettings);
router.put('/profile', validate(updateAccountProfileSchema), updateProfile);
router.put('/password', validate(updateAccountPasswordSchema), updatePassword);
router.put('/preferences', validate(updateAccountPreferencesSchema), updatePreferences);

export default router;
