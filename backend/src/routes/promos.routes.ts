import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  createPromoSchema, 
  updatePromoSchema, 
  promoQuerySchema,
  CreatePromoInput,
  UpdatePromoInput
} from '../core/validations/voucher.validation';

const router = Router();

// GET /api/promos - Get all promos (Admin only)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = promoQuerySchema.parse(req.query);
  const { page, limit, search, isActive, discountType, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (discountType) {
    where.discountType = discountType;
  }

  const [promos, total] = await Promise.all([
    prisma.promo.findMany({
      where,
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
            categories: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.promo.count({ where }),
  ]);

  res.json({
    promos,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/promos/active - Get active promos for customers
router.get('/active', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const now = new Date();
  
  const promos = await prisma.promo.findMany({
    where: {
      isActive: true,
      OR: [
        { startsAt: null },
        { startsAt: { lte: now } },
      ],
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: now } },
      ],
    },
    include: {
      products: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
      categories: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          products: {
            where: { isActive: true },
            take: 5,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ promos });
}));

// GET /api/promos/:id - Get promo by ID (Admin only)
router.get('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const promo = await prisma.promo.findUnique({
    where: { id },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          isActive: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
          isActive: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
      },
      _count: {
        select: {
          products: true,
          categories: true,
        },
      },
    },
  });

  if (!promo) {
    throw new CustomError('Promo not found', 404);
  }

  res.json({ promo });
}));

// POST /api/promos - Create promo (Admin only)
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = createPromoSchema.parse(req.body) as CreatePromoInput;
  const { name, discountType, discountValue, productIds, categoryIds, isActive, startsAt, expiresAt } = validatedData;

  // Validate discount value based on type
  if (discountType === 'PERCENTAGE' && discountValue > 100) {
    throw new CustomError('Percentage discount cannot exceed 100%', 400);
  }

  // Validate that either products or categories are specified
  if (!productIds?.length && !categoryIds?.length) {
    throw new CustomError('At least one product or category must be specified', 400);
  }

  // Validate products exist
  if (productIds?.length) {
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new CustomError('One or more products not found', 404);
    }
  }

  // Validate categories exist
  if (categoryIds?.length) {
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    if (categories.length !== categoryIds.length) {
      throw new CustomError('One or more categories not found', 404);
    }
  }

  const promo = await prisma.promo.create({
    data: {
      name,
      discountType,
      discountValue,
      isActive,
      startsAt: startsAt ? new Date(startsAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      products: productIds ? {
        connect: productIds.map(id => ({ id })),
      } : undefined,
      categories: categoryIds ? {
        connect: categoryIds.map(id => ({ id })),
      } : undefined,
    },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(201).json({
    message: 'Promo created successfully',
    promo,
  });
}));

// PUT /api/promos/:id - Update promo (Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updatePromoSchema.parse(req.body) as UpdatePromoInput;

  // Check if promo exists
  const existingPromo = await prisma.promo.findUnique({
    where: { id },
  });

  if (!existingPromo) {
    throw new CustomError('Promo not found', 404);
  }

  // Validate discount value based on type
  if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue && validatedData.discountValue > 100) {
    throw new CustomError('Percentage discount cannot exceed 100%', 400);
  }

  // Prepare update data
  const updateData: any = { ...validatedData };
  
  if (validatedData.startsAt) {
    updateData.startsAt = new Date(validatedData.startsAt);
  }
  
  if (validatedData.expiresAt) {
    updateData.expiresAt = new Date(validatedData.expiresAt);
  }

  // Handle product connections
  if (validatedData.productIds !== undefined) {
    if (validatedData.productIds.length === 0) {
      updateData.products = { set: [] };
    } else {
      // Validate products exist
      const products = await prisma.product.findMany({
        where: { id: { in: validatedData.productIds } },
      });

      if (products.length !== validatedData.productIds.length) {
        throw new CustomError('One or more products not found', 404);
      }

      updateData.products = { set: validatedData.productIds.map(id => ({ id })) };
    }
  }

  // Handle category connections
  if (validatedData.categoryIds !== undefined) {
    if (validatedData.categoryIds.length === 0) {
      updateData.categories = { set: [] };
    } else {
      // Validate categories exist
      const categories = await prisma.category.findMany({
        where: { id: { in: validatedData.categoryIds } },
      });

      if (categories.length !== validatedData.categoryIds.length) {
        throw new CustomError('One or more categories not found', 404);
      }

      updateData.categories = { set: validatedData.categoryIds.map(id => ({ id })) };
    }
  }

  const promo = await prisma.promo.update({
    where: { id },
    data: updateData,
    include: {
      products: {
        select: {
          id: true,
          name: true,
          price: true,
        },
      },
      categories: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.json({
    message: 'Promo updated successfully',
    promo,
  });
}));

// DELETE /api/promos/:id - Delete promo (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if promo exists
  const promo = await prisma.promo.findUnique({
    where: { id },
  });

  if (!promo) {
    throw new CustomError('Promo not found', 404);
  }

  await prisma.promo.delete({
    where: { id },
  });

  res.json({
    message: 'Promo deleted successfully',
  });
}));

// GET /api/promos/stats - Get promo statistics (Admin only)
router.get('/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [
    totalPromos,
    activePromos,
    inactivePromos,
    expiredPromos,
    percentagePromos,
    fixedPromos,
    totalProductsInPromos,
    totalCategoriesInPromos,
  ] = await Promise.all([
    prisma.promo.count(),
    prisma.promo.count({ where: { isActive: true } }),
    prisma.promo.count({ where: { isActive: false } }),
    prisma.promo.count({
      where: {
        expiresAt: { lt: new Date() },
      },
    }),
    prisma.promo.count({ where: { discountType: 'PERCENTAGE' } }),
    prisma.promo.count({ where: { discountType: 'FIXED' } }),
    prisma.promo.aggregate({
      _sum: {
        products: true,
      },
    }),
    prisma.promo.aggregate({
      _sum: {
        categories: true,
      },
    }),
  ]);

  res.json({
    stats: {
      overview: {
        total: totalPromos,
        active: activePromos,
        inactive: inactivePromos,
        expired: expiredPromos,
      },
      types: {
        percentage: percentagePromos,
        fixed: fixedPromos,
      },
      coverage: {
        totalProductsInPromos: totalProductsInPromos._sum.products || 0,
        totalCategoriesInPromos: totalCategoriesInPromos._sum.categories || 0,
      },
    },
  });
}));

export default router;
