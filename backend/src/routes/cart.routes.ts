import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  cartItemSchema, 
  updateCartItemSchema,
  CartItemInput,
  UpdateCartItemInput
} from '../core/validations/order.validation';

const router = Router();

// GET /api/cart - Get user's cart
router.get('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  // Get cart items with product details
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
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
    orderBy: { createdAt: 'desc' },
  });

  // Calculate cart totals
  const subtotal = cartItems.reduce((total, item) => {
    return total + (Number(item.product.price) * item.quantity);
  }, 0);

  const totalItems = cartItems.reduce((total, item) => {
    return total + item.quantity;
  }, 0);

  res.json({
    cartItems,
    summary: {
      totalItems,
      subtotal,
      // Shipping and tax will be calculated at checkout
    },
  });
}));

// POST /api/cart - Add item to cart
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const validatedData = cartItemSchema.parse(req.body) as CartItemInput;
  const { productId, quantity } = validatedData;

  // Check if product exists and is active
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  if (!product.isActive) {
    throw new CustomError('Product is not available', 400);
  }

  // Check stock availability
  if (product.stock < quantity) {
    throw new CustomError(`Insufficient stock. Only ${product.stock} items available`, 400);
  }

  // Check if item already exists in cart
  const existingCartItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId,
      },
    },
  });

  let cartItem;

  if (existingCartItem) {
    // Update quantity if item exists
    const newQuantity = existingCartItem.quantity + quantity;
    
    if (product.stock < newQuantity) {
      throw new CustomError(`Insufficient stock. Only ${product.stock} items available`, 400);
    }

    cartItem = await prisma.cartItem.update({
      where: { id: existingCartItem.id },
      data: { quantity: newQuantity },
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
    });
  } else {
    // Create new cart item
    cartItem = await prisma.cartItem.create({
      data: {
        userId,
        productId,
        quantity,
      },
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
    });
  }

  res.status(201).json({
    message: 'Item added to cart successfully',
    cartItem,
  });
}));

// PUT /api/cart/:itemId - Update cart item quantity
router.put('/:itemId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { itemId } = req.params;
  const validatedData = updateCartItemSchema.parse(req.body) as UpdateCartItemInput;
  const { quantity } = validatedData;

  // Check if cart item exists and belongs to user
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { product: true },
  });

  if (!cartItem) {
    throw new CustomError('Cart item not found', 404);
  }

  if (cartItem.userId !== userId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Check stock availability
  if (cartItem.product.stock < quantity) {
    throw new CustomError(`Insufficient stock. Only ${cartItem.product.stock} items available`, 400);
  }

  // Update cart item
  const updatedCartItem = await prisma.cartItem.update({
    where: { id: itemId },
    data: { quantity },
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
  });

  res.json({
    message: 'Cart item updated successfully',
    cartItem: updatedCartItem,
  });
}));

// DELETE /api/cart/:itemId - Remove item from cart
router.delete('/:itemId', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { itemId } = req.params;

  // Check if cart item exists and belongs to user
  const cartItem = await prisma.cartItem.findUnique({
    where: { id: itemId },
  });

  if (!cartItem) {
    throw new CustomError('Cart item not found', 404);
  }

  if (cartItem.userId !== userId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Delete cart item
  await prisma.cartItem.delete({
    where: { id: itemId },
  });

  res.json({
    message: 'Item removed from cart successfully',
  });
}));

// DELETE /api/cart - Clear entire cart
router.delete('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;

  // Delete all cart items for user
  const result = await prisma.cartItem.deleteMany({
    where: { userId },
  });

  res.json({
    message: 'Cart cleared successfully',
    deletedCount: result.count,
  });
}));

// POST /api/cart/merge - Merge guest cart with user cart (after login)
router.post('/merge', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { guestCartItems } = req.body; // Array of { productId, quantity }

  if (!Array.isArray(guestCartItems) || guestCartItems.length === 0) {
    throw new CustomError('Invalid guest cart data', 400);
  }

  const mergedItems = [];

  for (const guestItem of guestCartItems) {
    try {
      const validatedItem = cartItemSchema.parse(guestItem);
      const { productId, quantity } = validatedItem;

      // Check if product exists and is active
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product || !product.isActive) {
        continue; // Skip inactive products
      }

      // Check if item already exists in user's cart
      const existingCartItem = await prisma.cartItem.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (existingCartItem) {
        // Update quantity
        const newQuantity = existingCartItem.quantity + quantity;
        
        if (product.stock >= newQuantity) {
          const updatedItem = await prisma.cartItem.update({
            where: { id: existingCartItem.id },
            data: { quantity: newQuantity },
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
          });
          mergedItems.push(updatedItem);
        }
      } else {
        // Create new cart item
        if (product.stock >= quantity) {
          const newItem = await prisma.cartItem.create({
            data: {
              userId,
              productId,
              quantity,
            },
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
          });
          mergedItems.push(newItem);
        }
      }
    } catch (error) {
      // Skip invalid items
      continue;
    }
  }

  res.json({
    message: 'Cart merged successfully',
    mergedItems,
    mergedCount: mergedItems.length,
  });
}));

export default router;
