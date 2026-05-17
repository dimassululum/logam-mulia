import { Router } from 'express';
import * as productController from '../controller/product.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import { createProductSchema, displayReviewSchema, updateProductSchema } from '../schema/product.schema';
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

// Admin only (Display Reviews & Rating CMS)
router.post('/:id/display-reviews', authenticate, isAdmin, validate(displayReviewSchema), productController.createDisplayReview);
router.put('/:id/display-reviews/:reviewId', authenticate, isAdmin, validate(displayReviewSchema), productController.updateDisplayReview);
router.delete('/:id/display-reviews/:reviewId', authenticate, isAdmin, productController.deleteDisplayReview);

export default router;
