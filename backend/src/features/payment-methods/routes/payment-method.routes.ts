import { Router } from 'express';
import * as paymentMethodController from '../controller/payment-method.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { paymentDocumentUpload, upload } from '../../../core/middlewares/upload.middleware';

const router = Router();

router.get('/public', paymentMethodController.getPublicPaymentMethods);
router.get('/checkout', paymentMethodController.getCheckoutPaymentMethods);
router.get('/', authenticate, isAdmin, paymentMethodController.getAdminPaymentMethods);
router.get('/mode', authenticate, isAdmin, paymentMethodController.getPaymentGatewayMode);
router.put('/mode', authenticate, isAdmin, paymentMethodController.updatePaymentGatewayMode);
router.put('/:code', authenticate, isAdmin, paymentMethodController.updatePaymentMethod);
router.post('/qris-manual/image', authenticate, isAdmin, upload.single('qrisImage'), paymentMethodController.updateQrisImage);
router.post(
  '/bank-transfer/accounts/:accountId/attachment',
  authenticate,
  isAdmin,
  paymentDocumentUpload.single('savingsBookAttachment'),
  paymentMethodController.updateBankAccountAttachment
);

export default router;
