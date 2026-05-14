import { Router } from 'express';
import * as customerController from '../controller/customer.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, isAdmin, customerController.getCustomers);

export default router;
