import { Router } from 'express';
import * as orderController from '../controller/order.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';

const router = Router();

router.post('/', orderController.createOrder);
router.post('/:id/mark-paid', orderController.markOrderPaid);

router.get('/', authenticate, isAdmin, orderController.getAllOrders);
router.get('/:id', authenticate, isAdmin, orderController.getOrder);
router.put('/:id/status', authenticate, isAdmin, orderController.updateOrderStatus);

export default router;
