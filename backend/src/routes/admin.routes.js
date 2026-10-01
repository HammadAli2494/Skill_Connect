import { z } from 'zod';
import { Router } from 'express';
import {
  listAdminBookings,
  listAdminServices,
  listProviders,
  listUsers,
  providerDashboard,
  setServiceActive,
  setUserActive,
  stats,
} from '../controllers/admin.controller.js';
import { listReports, updateReport } from '../controllers/report.controller.js';
import { createReport } from '../controllers/report.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { reportSchema, reportUpdateSchema } from '../schemas/booking.schema.js';

const router = Router();
const activeSchema = z.object({ isActive: z.boolean() });

router.get('/stats', requireAuth, requireRole('admin'), stats);
router.get('/users', requireAuth, requireRole('admin'), listUsers);
router.patch('/users/:id/status', requireAuth, requireRole('admin'), validate(activeSchema), setUserActive);
router.get('/providers', requireAuth, requireRole('admin'), listProviders);
router.get('/services', requireAuth, requireRole('admin'), listAdminServices);
router.patch('/services/:id/status', requireAuth, requireRole('admin'), validate(activeSchema), setServiceActive);
router.get('/bookings', requireAuth, requireRole('admin'), listAdminBookings);
router.get('/reports', requireAuth, requireRole('admin'), listReports);
router.patch('/reports/:id', requireAuth, requireRole('admin'), validate(reportUpdateSchema), updateReport);
router.get('/provider-dashboard', requireAuth, requireRole('provider'), providerDashboard);

export const reportRouter = Router();
reportRouter.post('/', requireAuth, validate(reportSchema), createReport);

export default router;
