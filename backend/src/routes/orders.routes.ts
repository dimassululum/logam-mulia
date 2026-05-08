import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  createOrderSchema, 
  updateOrderSchema, 
  orderQuerySchema,
  CreateOrderInput,
  UpdateOrderInput
} from '../core/validations/order.validation';
import EmailService, { OrderEmailData } from '../core/utils/email';

const router = Router();

// Helper function to generate order ID
const generateOrderId = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${dateStr}-${random}`;
};

// GET /api/orders - Get user's orders or all orders (Admin)
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = orderQuerySchema.parse(req.query);
  const { page, limit, status, startDate, endDate, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

  const where: any = {};
  
  // For non-admin users, only show their own orders
  if (!isAdmin) {
    where.userId = req.user!.id;
  }

  if (status) {
    where.status = status;
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
        user: isAdmin ? {
          select: {
            id: true,
            name: true,
            email: true,
          },
        } : false,
        items: {
          include: {
            product: {
              include: {
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

// GET /api/orders/:id - Get order by ID
router.get('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: isAdmin ? {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      } : false,
      items: {
        include: {
          product: {
            include: {
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
  });

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  // Check if user owns the order or is admin
  if (!isAdmin && order.userId !== userId) {
    throw new CustomError('Unauthorized', 403);
  }

  res.json({ order });
}));

// POST /api/orders - Create new order
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const validatedData = createOrderSchema.parse(req.body) as CreateOrderInput;
  const { items, shippingAddress, shippingCourier, shippingCost, voucherId, notes } = validatedData;

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Check and validate all products
    const productIds = items.map(item => item.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      throw new CustomError('One or more products not found', 404);
    }

    // Check stock availability and calculate totals
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      
      if (!product || !product.isActive) {
        throw new CustomError(`Product ${item.productId} is not available`, 400);
      }

      if (product.stock < item.quantity) {
        throw new CustomError(`Insufficient stock for ${product.name}. Only ${product.stock} available`, 400);
      }

      const itemSubtotal = Number(product.price) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: product.price,
        subtotal: itemSubtotal,
      });
    }

    // Apply voucher if provided
    let discountAmount = 0;
    if (voucherId) {
      const voucher = await tx.voucher.findUnique({
        where: { id: voucherId },
      });

      if (!voucher || !voucher.isActive) {
        throw new CustomError('Invalid or inactive voucher', 400);
      }

      if (voucher.minimumOrder && subtotal < Number(voucher.minimumOrder)) {
        throw new CustomError(`Minimum order amount for this voucher is ${voucher.minimumOrder}`, 400);
      }

      if (voucher.discountType === 'PERCENTAGE') {
        discountAmount = subtotal * (Number(voucher.discountValue) / 100);
      } else {
        discountAmount = Number(voucher.discountValue);
      }

      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }
    }

    const grandTotal = subtotal + shippingCost - discountAmount;

    // Create order
    const order = await tx.order.create({
      data: {
        id: generateOrderId(),
        userId,
        status: 'PENDING',
        totalAmount: subtotal,
        shippingCost,
        discountAmount,
        grandTotal,
        shippingAddress: JSON.stringify(shippingAddress),
        shippingCity: shippingAddress.city,
        shippingCourier,
        voucherId,
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
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
    });

    // Update product stock
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    // Clear user's cart
    await tx.cartItem.deleteMany({
      where: { userId },
    });

    // Send order confirmation email
    try {
      const emailData: OrderEmailData = {
        userName: order.user.name,
        orderNumber: order.id,
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: Number(item.priceAtPurchase),
          subtotal: Number(item.subtotal),
        })),
        totalAmount: Number(order.totalAmount),
        shippingCost: Number(order.shippingCost),
        discountAmount: Number(order.discountAmount),
        grandTotal: Number(order.grandTotal),
        shippingAddress: JSON.parse(order.shippingAddress),
      };
      
      // Send email asynchronously (don't wait for it)
      EmailService.sendOrderConfirmationEmail(emailData, order.user.email).catch(error => {
        console.error('Failed to send order confirmation email:', error);
      });
    } catch (emailError) {
      console.error('Email preparation failed:', emailError);
      // Don't fail the order if email fails
    }

    return order;
  });

  res.status(201).json({
    message: 'Order created successfully',
    order: result,
  });
}));

// PUT /api/orders/:id - Update order (Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateOrderSchema.parse(req.body) as UpdateOrderInput;

  // Check if order exists
  const existingOrder = await prisma.order.findUnique({
    where: { id },
  });

  if (!existingOrder) {
    throw new CustomError('Order not found', 404);
  }

  // Update order
  const order = await prisma.order.update({
    where: { id },
    data: validatedData,
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
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  res.json({
    message: 'Order updated successfully',
    order,
  });
}));

// POST /api/orders/:id/cancel - Cancel order
router.post('/:id/cancel', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) {
    throw new CustomError('Order not found', 404);
  }

  // Check if user owns the order or is admin
  if (!isAdmin && order.userId !== userId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Check if order can be cancelled
  if (!['PENDING', 'Confirmed'].includes(order.status)) {
    throw new CustomError('Order cannot be cancelled', 400);
  }

  // Start transaction
  await prisma.$transaction(async (tx) => {
    // Update order status
    await tx.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Restore product stock
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
  });

  res.json({
    message: 'Order cancelled successfully',
  });
}));

// GET /api/orders/stats - Get order statistics (Admin only)
router.get('/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [
    totalOrders,
    pendingOrders,
    confirmedOrders,
    processingOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalRevenue,
    todayOrders,
    todayRevenue,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'Confirmed' } }),
    prisma.order.count({ where: { status: 'PROCESSING' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { grandTotal: true },
    }),
    prisma.order.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
        status: { not: 'CANCELLED' },
      },
      _sum: { grandTotal: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
        status: { not: 'CANCELLED' },
      },
      _sum: { grandTotal: true },
    }),
  ]);

  res.json({
    stats: {
      overview: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        total: Number(totalRevenue._sum.grandTotal || 0),
        today: Number(todayRevenue._sum.grandTotal || 0),
        monthly: Number(monthlyRevenue._sum.grandTotal || 0),
      },
      today: {
        orders: todayOrders,
      },
    },
  });
}));

export default router;
