import { Router } from 'express';
import * as boutiqueController from '../controller/boutique.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import { createBoutiqueProductSchema, updateBoutiqueProductSchema } from '../schema/boutique.schema';
import { upload } from '../../../core/middlewares/upload.middleware';

const router = Router();

// Public
router.get('/', boutiqueController.getAllBoutiqueProducts);
router.get('/:slug', boutiqueController.getBoutiqueProduct);

// Admin only
router.post('/', authenticate, isAdmin, validate(createBoutiqueProductSchema), boutiqueController.createBoutiqueProduct);
router.put('/:id', authenticate, isAdmin, validate(updateBoutiqueProductSchema), boutiqueController.updateBoutiqueProduct);
router.delete('/:id', authenticate, isAdmin, boutiqueController.deleteBoutiqueProduct);
router.post('/:id/image', authenticate, isAdmin, upload.single('image'), boutiqueController.uploadBoutiqueImage);

export default router;
