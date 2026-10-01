import { Router } from 'express';
import {
  createMyProfile,
  getMyProfile,
  getProvider,
  getProviderReviews,
  updateAvailability,
  updateMyProfile,
  uploadAvatar,
} from '../controllers/provider.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { availabilitySchema, providerProfileSchema } from '../schemas/provider.schema.js';

const router = Router();

router.get('/me', requireAuth, requireRole('provider'), getMyProfile);
router.post('/me', requireAuth, requireRole('provider'), validate(providerProfileSchema), createMyProfile);
router.patch('/me', requireAuth, requireRole('provider'), validate(providerProfileSchema.partial()), updateMyProfile);
router.patch('/me/availability', requireAuth, requireRole('provider'), validate(availabilitySchema), updateAvailability);
router.post('/me/avatar', requireAuth, upload.single('image'), uploadAvatar);
router.get('/:id', getProvider);
router.get('/:id/reviews', getProviderReviews);

export default router;
