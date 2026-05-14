import { Router } from 'express';
import * as productController from '../controller/product.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from '../schema/product.schema';
import { upload } from '../../../core/middlewares/upload.middleware';

const router = Router();

// Public
router.get('/', productController.getAllProducts);
router.get('/:slug', productController.getProduct);

// Admin only (Products)
router.post('/', authenticate, isAdmin, validate(createProductSchema), productController.createProduct);
router.put('/:id', authenticate, isAdmin, validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);

// Admin only (Product Images)
router.post('/:id/images', authenticate, isAdmin, upload.single('image'), productController.uploadImage);
router.delete('/:id/images/:imageId', authenticate, isAdmin, productController.deleteImage);

export default router;
