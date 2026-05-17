import { Router } from 'express';
import * as checkoutController from '../controller/checkout.controller';
import { upload } from '../../../core/middlewares/upload.middleware';

const router = Router();

router.get('/customer', checkoutController.lookupCustomer);
router.post('/customer', upload.single('ktp'), checkoutController.saveCustomer);
router.get('/destinations', checkoutController.searchDestinations);
router.get('/destinations/provinces', checkoutController.getProvinces);
router.get('/destinations/cities', checkoutController.getCities);
router.get('/destinations/districts', checkoutController.getDistricts);
router.get('/destinations/subdistricts', checkoutController.getSubdistricts);
router.get('/shipping-rates', checkoutController.getShippingRates);

export default router;
