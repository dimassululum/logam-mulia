import { Router } from 'express';
import * as companyProfileController from '../controller/company-profile.controller';
import { authenticate, isAdmin } from '../../../core/middlewares/auth.middleware';
import { validate } from '../../../core/middlewares/validate.middleware';
import { upsertCompanyProfileSchema, bulkUpsertSchema } from '../schema/company-profile.schema';

const router = Router();

// Public
router.get('/', companyProfileController.getCompanyProfile);

// Admin only
router.put('/', authenticate, isAdmin, validate(upsertCompanyProfileSchema), companyProfileController.upsertCompanyProfile);
router.post('/bulk', authenticate, isAdmin, validate(bulkUpsertSchema), companyProfileController.bulkUpsertCompanyProfile);

export default router;
