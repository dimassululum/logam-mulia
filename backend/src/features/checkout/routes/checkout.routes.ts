import { Router } from 'express';
import * as checkoutController from '../controller/checkout.controller';
import { upload } from '../../../core/middlewares/upload.middleware';

const router = Router();

router.get('/customer', checkoutController.lookupCustomer);
router.post('/customer', upload.single('ktp'), checkoutController.saveCustomer);
router.get('/shipping-rates', checkoutController.getShippingRates);

export default router;
