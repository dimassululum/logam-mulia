import { Router } from 'express';
import * as authController from '../controller/auth.controller';
import { authenticate } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  updateProfileSchema,
} from '../schema/auth.schema';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// POST /api/auth/refresh-token
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

// POST /api/auth/logout  [protected]
router.post('/logout', authenticate, authController.logout);

// GET /api/auth/me  [protected]
router.get('/me', authenticate, authController.getMe);

// PATCH /api/auth/me  [protected]
router.patch('/me', authenticate, validate(updateProfileSchema), authController.updateProfile);

export default router;
