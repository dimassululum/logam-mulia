import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  createReviewSchema, 
  updateReviewSchema, 
  reviewQuerySchema,
  CreateReviewInput,
  UpdateReviewInput
} from '../core/validations/voucher.validation';

const router = Router();

// GET /api/reviews - Get all reviews with filtering
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = reviewQuerySchema.parse(req.query);
  const { page, limit, productId, rating, isApproved, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (productId) {
    where.productId = productId;
  }

  if (rating) {
    where.rating = rating;
  }

  if (isApproved !== undefined) {
    where.isApproved = isApproved;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  res.json({
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/reviews/:id - Get review by ID
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!review) {
    throw new CustomError('Review not found', 404);
  }

  res.json({ review });
}));

// POST /api/reviews - Create review (verified buyer only)
router.post('/', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const validatedData = createReviewSchema.parse(req.body) as CreateReviewInput;
  const { productId, rating, comment } = validatedData;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  // Check if user has purchased this product (verified buyer check)
  const hasPurchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: 'DELIVERED', // Only delivered orders can review
      },
    },
  });

  if (!hasPurchased) {
    throw new CustomError('You can only review products you have purchased and received', 403);
  }

  // Check if user has already reviewed this product
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      productId,
    },
  });

  if (existingReview) {
    throw new CustomError('You have already reviewed this product', 400);
  }

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment,
      isApproved: true, // Auto-approve for now, can be changed to require moderation
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Update product rating
  await updateProductRating(productId);

  res.status(201).json({
    message: 'Review created successfully',
    review,
  });
}));

// PUT /api/reviews/:id - Update review (owner or admin)
router.put('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
  const { id } = req.params;
  const validatedData = updateReviewSchema.parse(req.body) as UpdateReviewInput;

  // Check if review exists
  const existingReview = await prisma.review.findUnique({
    where: { id },
  });

  if (!existingReview) {
    throw new CustomError('Review not found', 404);
  }

  // Check if user owns the review or is admin
  if (!isAdmin && existingReview.userId !== userId) {
    throw new CustomError('Unauthorized', 403);
  }

  // Only admins can approve/disapprove reviews
  if (validatedData.isApproved !== undefined && !isAdmin) {
    delete validatedData.isApproved;
  }

  const review = await prisma.review.update({
    where: { id },
    data: validatedData,
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Update product rating if rating or approval status changed
  if (validatedData.rating !== undefined || validatedData.isApproved !== undefined) {
    await updateProductRating(existingReview.productId);
  }

  res.json({
    message: 'Review updated successfully',
    review,
  });
}));

// DELETE /api/reviews/:id - Delete review (owner or admin)
router.delete('/:id', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN' || req.user!.role === 'SUPER_ADMIN';
  const { id } = req.params;

  // Check if review exists
  const existingReview = await prisma.review.findUnique({
    where: { id },
  });

  if (!existingReview) {
    throw new CustomError('Review not found', 404);
  }

  // Check if user owns the review or is admin
  if (!isAdmin && existingReview.userId !== userId) {
    throw new CustomError('Unauthorized', 403);
  }

  const productId = existingReview.productId;

  await prisma.review.delete({
    where: { id },
  });

  // Update product rating
  await updateProductRating(productId);

  res.json({
    message: 'Review deleted successfully',
  });
}));

// GET /api/reviews/product/:productId - Get reviews for specific product
router.get('/product/:productId', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const { page = '1', limit = '10' } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  const [reviews, total, ratingSummary] = await Promise.all([
    prisma.review.findMany({
      where: { 
        productId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.review.count({
      where: { 
        productId,
        isApproved: true,
      },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { 
        productId,
        isApproved: true,
      },
      _count: {
        rating: true,
      },
    }),
  ]);

  // Calculate rating distribution
  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingSummary.forEach(item => {
    ratingDistribution[item.rating as keyof typeof ratingDistribution] = item._count.rating;
  });

  const totalReviews = Object.values(ratingDistribution).reduce((sum, count) => sum + count, 0);
  const averageRating = ratingSummary.reduce((sum, item) => sum + (item.rating * item._count.rating), 0) / totalReviews || 0;

  res.json({
    reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
    summary: {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution,
    },
  });
}));

// GET /api/reviews/pending - Get pending reviews (Admin only)
router.get('/pending', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { page = '1', limit = '20' } = req.query;
  
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { isApproved: false },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.review.count({ where: { isApproved: false } }),
  ]);

  res.json({
    reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}));

// GET /api/reviews/stats - Get review statistics (Admin only)
router.get('/stats', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const [
    totalReviews,
    approvedReviews,
    pendingReviews,
    averageRating,
    ratingDistribution,
    recentReviews,
  ] = await Promise.all([
    prisma.review.count(),
    prisma.review.count({ where: { isApproved: true } }),
    prisma.review.count({ where: { isApproved: false } }),
    prisma.review.aggregate({
      where: { isApproved: true },
      _avg: { rating: true },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { isApproved: true },
      _count: { rating: true },
    }),
    prisma.review.findMany({
      where: { isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingDistribution.forEach(item => {
    distribution[item.rating as keyof typeof distribution] = item._count.rating;
  });

  res.json({
    stats: {
      overview: {
        total: totalReviews,
        approved: approvedReviews,
        pending: pendingReviews,
        averageRating: Math.round((Number(averageRating._avg.rating) || 0) * 10) / 10,
      },
      distribution,
      recent: recentReviews,
    },
  });
}));

// Helper function to update product rating
async function updateProductRating(productId: string): Promise<void> {
  const ratingData = await prisma.review.aggregate({
    where: { 
      productId,
      isApproved: true,
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: ratingData._avg.rating || 0,
      reviewCount: ratingData._count.rating,
    },
  });
}

export default router;
