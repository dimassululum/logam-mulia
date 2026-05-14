import { Router } from 'express';
import * as authController from '../controller/auth.controller';
import { authenticate } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../schema/auth.schema';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh-token
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// POST /api/auth/logout  [protected]
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me  [protected]
router.get('/me', authenticate, authController.getMe);

export default router;
