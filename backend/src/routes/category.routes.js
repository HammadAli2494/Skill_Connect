import { Router } from 'express';
import {
  createCategory,
  listAllCategories,
  listCategories,
  listCities,
  updateCategory,
} from '../controllers/category.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categorySchema, categoryUpdateSchema } from '../schemas/catalog.schema.js';

const router = Router();

router.get('/', listCategories);
router.get('/cities', listCities);
router.get('/admin', requireAuth, requireRole('admin'), listAllCategories);
router.post('/', requireAuth, requireRole('admin'), validate(categorySchema), createCategory);
router.patch('/:id', requireAuth, requireRole('admin'), validate(categoryUpdateSchema), updateCategory);

export default router;
