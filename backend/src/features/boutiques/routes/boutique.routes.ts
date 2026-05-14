import { Router } from 'express';
import * as boutiqueController from '../controller/boutique.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import { createBoutiqueSchema, updateBoutiqueSchema } from '../schema/boutique.schema';

const router = Router();

// Public
router.get('/', boutiqueController.getAllBoutiques);
router.get('/:slug', boutiqueController.getBoutique);

// Admin only
router.post('/', authenticate, isAdmin, validate(createBoutiqueSchema), boutiqueController.createBoutique);
router.put('/:id', authenticate, isAdmin, validate(updateBoutiqueSchema), boutiqueController.updateBoutique);
router.delete('/:id', authenticate, isAdmin, boutiqueController.deleteBoutique);

export default router;
