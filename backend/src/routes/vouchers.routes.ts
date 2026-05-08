import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  createVoucherSchema, 
  updateVoucherSchema, 
  voucherQuerySchema,
  validateVoucherSchema,
  CreateVoucherInput,
  UpdateVoucherInput,
  ValidateVoucherInput
} from '../core/validations/voucher.validation';

const router = Router();

// GET /api/vouchers - Get all vouchers (Admin only)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = voucherQuerySchema.parse(req.query);
  const { page, limit, search, isActive, discountType, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (discountType) {
    where.discountType = discountType;
  }

  const [vouchers, total] = await Promise.all([
    prisma.voucher.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.voucher.count({ where }),
  ]);

  res.json({
    vouchers,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/vouchers/active - Get active vouchers for customers
router.get('/active', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const now = new Date();
  
  const vouchers = await prisma.voucher.findMany({
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
      OR: [
        { usageLimit: null },
        { usageCount: { lt: prisma.voucher.fields.usageLimit } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ vouchers });
}));

// GET /api/vouchers/:id - Get voucher by ID (Admin only)
router.get('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  if (!voucher) {
    throw new CustomError('Voucher not found', 404);
  }

  res.json({ voucher });
}));

// POST /api/vouchers - Create voucher (Admin only)
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = createVoucherSchema.parse(req.body) as CreateVoucherInput;

  // Check if voucher code already exists
  const existingVoucher = await prisma.voucher.findUnique({
    where: { code: validatedData.code.toUpperCase() },
  });

  if (existingVoucher) {
    throw new CustomError('Voucher with this code already exists', 409);
  }

  // Validate discount value based on type
  if (validatedData.discountType === 'PERCENTAGE' && validatedData.discountValue > 100) {
    throw new CustomError('Percentage discount cannot exceed 100%', 400);
  }

  // Validate max discount for percentage discounts
  if (validatedData.discountType === 'PERCENTAGE' && !validatedData.maxDiscount) {
    throw new CustomError('Maximum discount is required for percentage discounts', 400);
  }

  const voucher = await prisma.voucher.create({
    data: {
      ...validatedData,
      code: validatedData.code.toUpperCase(),
    },
  });

  res.status(201).json({
    message: 'Voucher created successfully',
    voucher,
  });
}));

// PUT /api/vouchers/:id - Update voucher (Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateVoucherSchema.parse(req.body) as UpdateVoucherInput;

  // Check if voucher exists
  const existingVoucher = await prisma.voucher.findUnique({
    where: { id },
  });

  if (!existingVoucher) {
    throw new CustomError('Voucher not found', 404);
  }

  // Check if code already exists (if updating code)
  if (validatedData.code && validatedData.code !== existingVoucher.code) {
    const duplicateVoucher = await prisma.voucher.findUnique({
      where: { code: validatedData.code.toUpperCase() },
    });

    if (duplicateVoucher) {
      throw new CustomError('Voucher with this code already exists', 409);
    }
  }

  // Validate discount value based on type
  const discountType = validatedData.discountType || existingVoucher.discountType;
  const discountValue = validatedData.discountValue || existingVoucher.discountValue;

  if (discountType === 'PERCENTAGE' && discountValue > 100) {
    throw new CustomError('Percentage discount cannot exceed 100%', 400);
  }

  // Validate max discount for percentage discounts
  if (discountType === 'PERCENTAGE') {
    const maxDiscount = validatedData.maxDiscount || existingVoucher.maxDiscount;
    if (!maxDiscount) {
      throw new CustomError('Maximum discount is required for percentage discounts', 400);
    }
  }

  const voucher = await prisma.voucher.update({
    where: { id },
    data: {
      ...validatedData,
      ...(validatedData.code && { code: validatedData.code.toUpperCase() }),
    },
  });

  res.json({
    message: 'Voucher updated successfully',
    voucher,
  });
}));

// DELETE /api/vouchers/:id - Delete voucher (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if voucher exists
  const voucher = await prisma.voucher.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orders: true,
        },
      },
    },
  });

  if (!voucher) {
    throw new CustomError('Voucher not found', 404);
  }

  // Check if voucher is being used in orders
  if (voucher._count.orders > 0) {
    throw new CustomError('Cannot delete voucher that has been used in orders', 400);
  }

  await prisma.voucher.delete({
    where: { id },
  });

  res.json({
    message: 'Voucher deleted successfully',
  });
}));

// POST /api/vouchers/validate - Validate voucher code
router.post('/validate', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const validatedData = validateVoucherSchema.parse(req.body) as ValidateVoucherInput;
  const { code, totalAmount } = validatedData;

  // Find voucher
  const voucher = await prisma.voucher.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!voucher) {
    throw new CustomError('Invalid voucher code', 404);
  }

  // Check if voucher is active
  if (!voucher.isActive) {
    throw new CustomError('Voucher is not active', 400);
  }

  const now = new Date();

  // Check start date
  if (voucher.startsAt && voucher.startsAt > now) {
    throw new CustomError('Voucher is not yet active', 400);
  }

  // Check expiry date
  if (voucher.expiresAt && voucher.expiresAt < now) {
    throw new CustomError('Voucher has expired', 400);
  }

  // Check usage limit
  if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
    throw new CustomError('Voucher usage limit reached', 400);
  }

  // Check minimum purchase
  if (totalAmount < Number(voucher.minPurchase)) {
    throw new CustomError(`Minimum purchase amount is ${voucher.minPurchase}`, 400);
  }

  // Check per-user limit
  const userOrderCount = await prisma.order.count({
    where: {
      userId,
      voucherId: voucher.id,
      status: { not: 'CANCELLED' },
    },
  });

  if (userOrderCount >= voucher.perUserLimit) {
    throw new CustomError(`You have reached the usage limit for this voucher (${voucher.perUserLimit} times)`, 400);
  }

  // Calculate discount
  let discountAmount = 0;
  if (voucher.discountType === 'PERCENTAGE') {
    discountAmount = totalAmount * (Number(voucher.discountValue) / 100);
    
    // Apply max discount if set
    if (voucher.maxDiscount) {
      discountAmount = Math.min(discountAmount, Number(voucher.maxDiscount));
    }
  } else {
    discountAmount = Number(voucher.discountValue);
  }

  // Ensure discount doesn't exceed total amount
  discountAmount = Math.min(discountAmount, totalAmount);

  const finalAmount = totalAmount - discountAmount;

  res.json({
    valid: true,
    voucher: {
      id: voucher.id,
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minPurchase: voucher.minPurchase,
      maxDiscount: voucher.maxDiscount,
    },
    discountAmount,
    finalAmount,
    message: `Voucher applied! You saved ${discountAmount.toLocaleString()}`,
  });
}));

// GET /api/vouchers/stats - Get voucher statistics (Admin only)
router.get('/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [
    totalVouchers,
    activeVouchers,
    inactiveVouchers,
    expiredVouchers,
    percentageVouchers,
    fixedVouchers,
    totalUsage,
    totalDiscountGiven,
    mostUsedVoucher,
  ] = await Promise.all([
    prisma.voucher.count(),
    prisma.voucher.count({ where: { isActive: true } }),
    prisma.voucher.count({ where: { isActive: false } }),
    prisma.voucher.count({
      where: {
        expiresAt: { lt: new Date() },
      },
    }),
    prisma.voucher.count({ where: { discountType: 'PERCENTAGE' } }),
    prisma.voucher.count({ where: { discountType: 'FIXED' } }),
    prisma.voucher.aggregate({
      _sum: { usageCount: true },
    }),
    prisma.order.aggregate({
      where: {
        voucherId: { not: null },
        status: { not: 'CANCELLED' },
      },
      _sum: { discountAmount: true },
    }),
    prisma.voucher.findFirst({
      orderBy: { usageCount: 'desc' },
      select: {
        id: true,
        code: true,
        usageCount: true,
        discountType: true,
        discountValue: true,
      },
    }),
  ]);

  res.json({
    stats: {
      overview: {
        total: totalVouchers,
        active: activeVouchers,
        inactive: inactiveVouchers,
        expired: expiredVouchers,
      },
      types: {
        percentage: percentageVouchers,
        fixed: fixedVouchers,
      },
      usage: {
        totalUsage: totalUsage._sum.usageCount || 0,
        totalDiscountGiven: Number(totalDiscountGiven._sum.discountAmount || 0),
      },
      mostUsed: mostUsedVoucher,
    },
  });
}));

export default router;
