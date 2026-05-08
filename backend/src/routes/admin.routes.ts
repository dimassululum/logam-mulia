import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  dashboardQuerySchema,
  updateSettingsSchema,
  adminUserQuerySchema,
  updateUserStatusSchema,
  adminOrderQuerySchema,
  bulkOrderUpdateSchema,
  DashboardQueryInput,
  UpdateSettingsInput,
  AdminUserQueryInput,
  UpdateUserStatusInput,
  AdminOrderQueryInput,
  BulkOrderUpdateInput
} from '../core/validations/admin.validation';

const router = Router();

// Helper function to get date range
const getDateRange = (period: string) => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { startDate, endDate: now };
};

// GET /api/admin/dashboard - Dashboard statistics
router.get('/dashboard', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = dashboardQuerySchema.parse(req.query) as DashboardQueryInput;
  const { period, startDate: customStartDate, endDate: customEndDate } = validatedQuery;
  
  const { startDate, endDate } = customStartDate && customEndDate 
    ? { startDate: new Date(customStartDate), endDate: new Date(customEndDate) }
    : getDateRange(period);

  // Get all dashboard statistics in parallel
  const [
    totalUsers,
    activeUsers,
    newUsers,
    totalOrders,
    completedOrders,
    totalRevenue,
    periodRevenue,
    totalProducts,
    activeProducts,
    lowStockProducts,
    topProducts,
    recentOrders,
    orderStatusStats,
    userGrowthStats,
    revenueStats,
  ] = await Promise.all([
    // User statistics
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    
    // Order statistics
    prisma.order.count(),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { grandTotal: true },
    }),
    
    // Period revenue
    prisma.order.aggregate({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { grandTotal: true },
    }),
    
    // Product statistics
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({
      where: {
        isActive: true,
        stock: { lt: 10 },
      },
    }),
    
    // Top products
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: { not: 'CANCELLED' },
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
    
    // Recent orders
    prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    }),
    
    // Order status statistics
    prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    
    // User growth statistics (last 30 days)
    prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { createdAt: true },
    }),
    
    // Revenue statistics (last 30 days)
    prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _sum: { grandTotal: true },
    }),
  ]);

  // Get product details for top products
  const topProductIds = topProducts.map(p => p.productId);
  const topProductDetails = await prisma.product.findMany({
    where: { id: { in: topProductIds } },
    select: {
      id: true,
      name: true,
      price: true,
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
  });

  const topProductsWithDetails = topProducts.map(product => {
    const details = topProductDetails.find(p => p.id === product.productId);
    return {
      ...product,
      product: details,
    };
  });

  // Calculate growth rates
  const previousPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
  const previousPeriodEnd = startDate;
  
  const [previousUsers, previousRevenue] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd },
      },
    }),
    prisma.order.aggregate({
      where: {
        status: { not: 'CANCELLED' },
        createdAt: { gte: previousPeriodStart, lte: previousPeriodEnd },
      },
      _sum: { grandTotal: true },
    }),
  ]);

  const userGrowthRate = previousUsers > 0 ? ((newUsers - previousUsers) / previousUsers) * 100 : 0;
  const revenueGrowthRate = Number(previousRevenue._sum.grandTotal || 0) > 0 
    ? ((Number(periodRevenue._sum.grandTotal || 0) - Number(previousRevenue._sum.grandTotal || 0)) / Number(previousRevenue._sum.grandTotal || 0)) * 100 
    : 0;

  res.json({
    dashboard: {
      overview: {
        totalUsers,
        activeUsers,
        newUsers,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        totalOrders,
        completedOrders,
        totalRevenue: Number(totalRevenue._sum.grandTotal || 0),
        periodRevenue: Number(periodRevenue._sum.grandTotal || 0),
        revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
        totalProducts,
        activeProducts,
        lowStockProducts,
      },
      topProducts: topProductsWithDetails,
      recentOrders,
      orderStatusStats: orderStatusStats.map(stat => ({
        status: stat.status,
        count: stat._count.status,
      })),
      period: {
        startDate,
        endDate,
        type: period,
      },
    },
  });
}));

// GET /api/admin/users - User management
router.get('/users', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = adminUserQuerySchema.parse(req.query) as AdminUserQueryInput;
  const { page, limit, search, role, isActive, isKycVerified, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (isKycVerified !== undefined) {
    where.isKycVerified = isKycVerified;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isKycVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            orders: true,
            reviews: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// PUT /api/admin/users/:id - Update user status
router.put('/users/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateUserStatusSchema.parse(req.body) as UpdateUserStatusInput;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new CustomError('User not found', 404);
  }

  // Prevent admin from deactivating themselves
  if (id === req.user!.id && !validatedData.isActive) {
    throw new CustomError('Cannot deactivate your own account', 400);
  }

  // Only SUPER_ADMIN can assign SUPER_ADMIN role
  if (validatedData.role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
    throw new CustomError('Only SUPER_ADMIN can assign SUPER_ADMIN role', 403);
  }

  const user = await prisma.user.update({
    where: { id },
    data: validatedData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isKycVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    message: 'User updated successfully',
    user,
  });
}));

// GET /api/admin/orders - Order management
router.get('/orders', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = adminOrderQuerySchema.parse(req.query) as AdminOrderQueryInput;
  const { page, limit, status, search, startDate, endDate, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
        voucher: {
          select: {
            id: true,
            code: true,
            discountType: true,
            discountValue: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  res.json({
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/admin/orders/:id - Get single order detail
router.get('/orders/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, slug: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
      voucher: { select: { id: true, code: true, discountType: true, discountValue: true } },
    },
  });

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  res.json({ order });
}));

// PATCH /api/admin/orders/:id/status - Update single order status
router.patch('/orders/:id/status', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, trackingNumber } = req.body;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) throw new CustomError('Order not found', 404);

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(trackingNumber ? { trackingNumber } : {}),
    },
  });

  res.json({ message: 'Order status updated', order: updated });
}));

// POST /api/admin/orders/bulk-update - Bulk update orders
router.post('/orders/bulk-update', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = bulkOrderUpdateSchema.parse(req.body) as BulkOrderUpdateInput;
  const { orderIds, updateData } = validatedData;

  // Check if all orders exist
  const existingOrders = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, status: true, items: true },
  });

  if (existingOrders.length !== orderIds.length) {
    throw new CustomError('One or more orders not found', 404);
  }

  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    'PENDING': ['Confirmed', 'CANCELLED'],
    'Confirmed': ['PROCESSING', 'CANCELLED'],
    'PROCESSING': ['SHIPPED'],
    'SHIPPED': ['DELIVERED'],
    'DELIVERED': [],
    'CANCELLED': [],
  };

  for (const order of existingOrders) {
    const allowedStatuses = validTransitions[order.status];
    if (!allowedStatuses.includes(updateData.status)) {
      throw new CustomError(`Cannot change order ${order.id} from ${order.status} to ${updateData.status}`, 400);
    }
  }

  // Update orders in transaction
  const updatedOrders = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const orderId of orderIds) {
      const order = existingOrders.find(o => o.id === orderId);
      
      // Handle stock restoration for cancelled orders
      if (updateData.status === 'CANCELLED' && order.status !== 'CANCELLED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Handle stock deduction for reactivated orders
      if (order.status === 'CANCELLED' && updateData.status !== 'CANCELLED') {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product || product.stock < item.quantity) {
            throw new CustomError(`Insufficient stock for product ${item.productId}`, 400);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      results.push(updatedOrder);
    }

    return results;
  });

  res.json({
    message: `${updatedOrders.length} orders updated successfully`,
    orders: updatedOrders,
  });
}));

// GET /api/admin/settings - Get all settings
router.get('/settings', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const settings = await prisma.setting.findMany({
    orderBy: { key: 'asc' },
  });

  // Convert to key-value object
  const settingsObject = settings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  res.json({
    settings: settingsObject,
  });
}));

// POST /api/admin/settings - Update settings
router.post('/settings', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = updateSettingsSchema.parse(req.body) as UpdateSettingsInput;
  const { settings } = validatedData;

  // Update settings in transaction
  const updatedSettings = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const [key, value] of Object.entries(settings)) {
      const setting = await tx.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
      results.push(setting);
    }

    return results;
  });

  // Convert to key-value object
  const settingsObject = updatedSettings.reduce((acc, setting) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {} as Record<string, string>);

  res.json({
    message: 'Settings updated successfully',
    settings: settingsObject,
  });
}));

export default router;
