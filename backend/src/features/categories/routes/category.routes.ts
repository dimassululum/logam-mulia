import { Router } from 'express';
import * as categoryController from '../controller/category.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import { createCategorySchema, updateCategorySchema } from '../schema/category.schema';

const router = Router();

// Public
router.get('/', categoryController.getAllCategories);
router.get('/:slug', categoryController.getCategory);

// Admin only
router.post('/', authenticate, isAdmin, validate(createCategorySchema), categoryController.createCategory);
router.put('/:id', authenticate, isAdmin, validate(updateCategorySchema), categoryController.updateCategory);
router.delete('/:id', authenticate, isAdmin, categoryController.deleteCategory);

export default router;
