import { Router } from 'express';
import * as duitkuController from './duitku.controller';

const router = Router();

router.post('/callback', duitkuController.handleCallback);

export default router;
