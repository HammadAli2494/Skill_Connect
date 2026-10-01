import { Router } from 'express';
import {
  addServiceImage,
  createService,
  deactivateService,
  getService,
  listServices,
  myServices,
  removeServiceImage,
  updateService,
} from '../controllers/service.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { serviceQuerySchema, serviceSchema, serviceUpdateSchema } from '../schemas/catalog.schema.js';

const router = Router();

router.get('/', validate(serviceQuerySchema, 'query'), listServices);
router.get('/mine', requireAuth, requireRole('provider'), myServices);
router.get('/:id', getService);
router.post('/', requireAuth, requireRole('provider'), validate(serviceSchema), createService);
router.patch('/:id', requireAuth, requireRole('provider'), validate(serviceUpdateSchema), updateService);
router.delete('/:id', requireAuth, requireRole('provider'), deactivateService);
router.post('/:id/images', requireAuth, requireRole('provider'), upload.single('image'), addServiceImage);
router.delete('/:id/images/:publicId', requireAuth, requireRole('provider'), removeServiceImage);

export default router;
