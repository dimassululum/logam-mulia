import { Router } from 'express';
import * as metalPriceController from '../controller/metal-price.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import { updateMetalPricesSchema } from '../schema/metal-price.schema';

const router = Router();

router.get('/public', metalPriceController.getMetalPrices);
router.get('/', authenticate, isAdmin, metalPriceController.getMetalPrices);
router.post('/', authenticate, isAdmin, validate(updateMetalPricesSchema), metalPriceController.updateMetalPrices);

export default router;
