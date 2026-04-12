import { Router } from 'express';
import multer from 'multer';
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
const profilePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
      callback(null, true);
      return;
    }

    callback(new Error('Only JPG and PNG profile photos are allowed'));
  },
});

const uploadProfilePhoto = (req, res, next) => {
  profilePhotoUpload.single('profilePhotoFile')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'Profile photo must be 2MB or smaller' });
      return;
    }

    if (err.message === 'Only JPG and PNG profile photos are allowed') {
      res.status(400).json({ error: err.message });
      return;
    }

    next(err);
  });
};

router.use(requireAuth);

router.get('/me', getMyAccountSettings);
router.put('/profile', uploadProfilePhoto, validate(updateAccountProfileSchema), updateProfile);
router.put('/password', validate(updateAccountPasswordSchema), updatePassword);
router.put('/preferences', validate(updateAccountPreferencesSchema), updatePreferences);

export default router;
