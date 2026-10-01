import { Router } from 'express';
import {
  createBooking,
  getAvailability,
  getBooking,
  listMyBookings,
  updateBookingStatus,
} from '../controllers/booking.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { bookingStatusSchema, createBookingSchema, listQuerySchema } from '../schemas/booking.schema.js';

const router = Router();

router.get('/availability/:id', getAvailability);
router.post('/', requireAuth, requireRole('customer'), validate(createBookingSchema), createBooking);
router.get('/me', requireAuth, requireRole('customer', 'provider'), validate(listQuerySchema, 'query'), listMyBookings);
router.get('/:id', requireAuth, getBooking);
router.patch('/:id/status', requireAuth, requireRole('customer', 'provider'), validate(bookingStatusSchema), updateBookingStatus);

export default router;
