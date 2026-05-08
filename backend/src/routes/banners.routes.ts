import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  createBannerSchema, 
  updateBannerSchema, 
  bannerQuerySchema,
  CreateBannerInput,
  UpdateBannerInput,
  BannerQueryInput
} from '../core/validations/admin.validation';

const router = Router();

// GET /api/banners - Get all banners (Admin only)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = bannerQuerySchema.parse(req.query) as BannerQueryInput;
  const { page, limit, position, isActive, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (position) {
    where.position = position;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  // Add date filtering for active banners
  const now = new Date();
  if (isActive === true) {
    where.AND = [
      {
        OR: [
          { startsAt: null },
          { startsAt: { lte: now } },
        ],
      },
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
    ];
  }

  const [banners, total] = await Promise.all([
    prisma.banner.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.banner.count({ where }),
  ]);

  res.json({
    banners,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/banners/public - Get active banners for public
router.get('/public', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { position } = req.query;
  const now = new Date();
  
  const where: any = {
    isActive: true,
    OR: [
      { startsAt: null },
      { startsAt: { lte: now } },
    ],
    OR: [
      { expiresAt: null },
      { expiresAt: { gte: now } },
    ],
  };

  if (position) {
    where.position = position;
  }

  const banners = await prisma.banner.findMany({
    where,
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  res.json({ banners });
}));

// GET /api/banners/:id - Get banner by ID (Admin only)
router.get('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    throw new CustomError('Banner not found', 404);
  }

  res.json({ banner });
}));

// POST /api/banners - Create banner (Admin only)
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = createBannerSchema.parse(req.body) as CreateBannerInput;
  const { title, subtitle, imageUrl, linkUrl, isActive, position, sortOrder, startsAt, expiresAt } = validatedData;

  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle,
      imageUrl,
      linkUrl,
      isActive,
      position,
      sortOrder,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  res.status(201).json({
    message: 'Banner created successfully',
    banner,
  });
}));

// PUT /api/banners/:id - Update banner (Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateBannerSchema.parse(req.body) as UpdateBannerInput;

  // Check if banner exists
  const existingBanner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!existingBanner) {
    throw new CustomError('Banner not found', 404);
  }

  const updateData: any = { ...validatedData };
  
  if (validatedData.startsAt) {
    updateData.startsAt = new Date(validatedData.startsAt);
  }
  
  if (validatedData.expiresAt) {
    updateData.expiresAt = new Date(validatedData.expiresAt);
  }

  const banner = await prisma.banner.update({
    where: { id },
    data: updateData,
  });

  res.json({
    message: 'Banner updated successfully',
    banner,
  });
}));

// DELETE /api/banners/:id - Delete banner (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if banner exists
  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    throw new CustomError('Banner not found', 404);
  }

  await prisma.banner.delete({
    where: { id },
  });

  res.json({
    message: 'Banner deleted successfully',
  });
}));

// POST /api/banners/:id/toggle - Toggle banner status (Admin only)
router.post('/:id/toggle', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if banner exists
  const banner = await prisma.banner.findUnique({
    where: { id },
  });

  if (!banner) {
    throw new CustomError('Banner not found', 404);
  }

  const updatedBanner = await prisma.banner.update({
    where: { id },
    data: {
      isActive: !banner.isActive,
    },
  });

  res.json({
    message: `Banner ${updatedBanner.isActive ? 'activated' : 'deactivated'} successfully`,
    banner: updatedBanner,
  });
}));

// POST /api/banners/reorder - Reorder banners (Admin only)
router.post('/reorder', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { bannerOrders } = req.body; // Array of { id: string, sortOrder: number }

  if (!Array.isArray(bannerOrders)) {
    throw new CustomError('Invalid banner orders data', 400);
  }

  // Update banners in transaction
  await prisma.$transaction(async (tx) => {
    for (const { id, sortOrder } of bannerOrders) {
      await tx.banner.update({
        where: { id },
        data: { sortOrder },
      });
    }
  });

  res.json({
    message: 'Banners reordered successfully',
  });
}));

export default router;
