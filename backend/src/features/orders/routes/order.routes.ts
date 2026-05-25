import { Router } from 'express';
import * as orderController from '../controller/order.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { upload } from '../../../core/middlewares/upload.middleware';

const router = Router();

router.post('/', orderController.createOrder);
router.get('/my', authenticate, orderController.getMyOrders);
router.get('/my/:id', authenticate, orderController.getMyOrder);
router.post('/:id/payment-proof', authenticate, upload.single('paymentProof'), orderController.uploadPaymentProof);

router.get('/', authenticate, isAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, isAdmin, orderController.getOrder);
router.post('/:id/confirm-payment', authenticate, isAdmin, orderController.confirmPayment);
router.put('/:id/status', authenticate, isAdmin, orderController.updateOrderStatus);

export default router;
