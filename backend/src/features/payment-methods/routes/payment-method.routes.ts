import { Router } from 'express';
import * as paymentMethodController from '../controller/payment-method.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { upload } from '../../../core/middlewares/upload.middleware';

const router = Router();

router.get('/public', paymentMethodController.getPublicPaymentMethods);
router.get('/', authenticate, isAdmin, paymentMethodController.getAdminPaymentMethods);
router.put('/:code', authenticate, isAdmin, paymentMethodController.updatePaymentMethod);
router.post('/qris-manual/image', authenticate, isAdmin, upload.single('qrisImage'), paymentMethodController.updateQrisImage);

export default router;
