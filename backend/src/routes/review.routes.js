import { Router } from 'express';
import { createReview, serviceReviews } from '../controllers/review.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reviewSchema } from '../schemas/booking.schema.js';

const router = Router();

router.get('/service/:id', serviceReviews);
router.post('/', requireAuth, requireRole('customer'), validate(reviewSchema), createReview);

export default router;
