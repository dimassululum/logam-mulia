import { Router } from 'express';
import * as voucherController from '../controller/voucher.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import {
  createVoucherSchema,
  updateVoucherSchema,
  validateVoucherSchema,
} from '../schema/voucher.schema';

const router = Router();

// Public storefront
router.get('/public', voucherController.getPublicActiveVouchers);

// Customer/Admin
router.post(
  '/validate',
  authenticate,
  validate(validateVoucherSchema),
  voucherController.validateVoucher
);

// Admin only
router.get('/', authenticate, isAdmin, voucherController.getAllVouchers);
router.get('/:id', authenticate, isAdmin, voucherController.getVoucher);
router.post('/', authenticate, isAdmin, validate(createVoucherSchema), voucherController.createVoucher);
router.put('/:id', authenticate, isAdmin, validate(updateVoucherSchema), voucherController.updateVoucher);
router.delete('/:id', authenticate, isAdmin, voucherController.deleteVoucher);

export default router;
