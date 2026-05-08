import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest, selfOrAdmin } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';

const router = Router();

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).optional(),
  isActive: z.boolean().optional(),
  isKycVerified: z.boolean().optional(),
});

const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN', 'SUPER_ADMIN']).default('CUSTOMER'),
});

// GET /api/users - Get all users (Admin only)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '10', search, role, isActive } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isKycVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
            addresses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}));

// GET /api/users/:id - Get user by ID (Admin or Self)
router.get('/:id', authenticate, selfOrAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isKycVerified: true,
      ktpUrl: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      addresses: {
        select: {
          id: true,
          label: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
          isDefault: true,
        },
      },
      orders: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          orders: true,
          reviews: true,
          addresses: true,
        },
      },
    },
  });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.json({ user });
}));

// POST /api/users - Create user (Admin only)
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = createUserSchema.parse(req.body);
  const { name, email, password, phone, role } = validatedData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new CustomError('User with this email already exists', 409);
  }

  // Hash password
  const bcrypt = require('bcryptjs');
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isKycVerified: true,
      isActive: true,
      createdAt: true,
    },
  });

  res.status(201).json({
    message: 'User created successfully',
    user,
  });
}));

// PUT /api/users/:id - Update user (Admin or Self)
router.put('/:id', authenticate, selfOrAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateUserSchema.parse(req.body);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new CustomError('User not found', 404);
  }

  // Only admins can change role and isActive
  if (req.user!.role !== 'ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    delete validatedData.role;
    delete validatedData.isActive;
    delete validatedData.isKycVerified;
  }

  const user = await prisma.user.update({
    where: { id },
    data: validatedData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isKycVerified: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    message: 'User updated successfully',
    user,
  });
}));

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new CustomError('User not found', 404);
  }

  // Prevent deleting super admin (except by super admin)
  if (existingUser.role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    throw new CustomError('Cannot delete Super Admin', 403);
  }

  // Prevent self-deletion
  if (id === req.user!.id) {
    throw new CustomError('Cannot delete your own account', 400);
  }

  // Soft delete by setting isActive to false
  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({
    message: 'User deactivated successfully',
  });
}));

// POST /api/users/:id/reactivate - Reactivate user (Admin only)
router.post('/:id/reactivate', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  res.json({
    message: 'User reactivated successfully',
    user,
  });
}));

// GET /api/users/stats - Get user statistics (Admin only)
router.get('/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [
    totalUsers,
    activeUsers,
    inactiveUsers,
    customers,
    admins,
    superAdmins,
    kycVerified,
    kycPending,
    newUsersThisMonth,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { role: 'SUPER_ADMIN' } }),
    prisma.user.count({ where: { isKycVerified: true } }),
    prisma.user.count({ where: { isKycVerified: false } }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
  ]);

  res.json({
    stats: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      byRole: {
        customers,
        admins,
        superAdmins,
      },
      kyc: {
        verified: kycVerified,
        pending: kycPending,
      },
      newThisMonth: newUsersThisMonth,
    },
  });
}));

export default router;
