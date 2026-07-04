import { Router } from 'express';
import * as midtransController from './midtrans.controller';

const router = Router();

router.post('/notification', midtransController.handleNotification);

export default router;
