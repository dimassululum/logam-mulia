import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { uploadProductImages, validateUploadedFiles, getFileUrl } from '../core/utils/upload';
import { 
  createProductSchema, 
  updateProductSchema, 
  productQuerySchema,
  bulkUpdateProductsSchema,
  bulkDeleteProductsSchema,
  CreateProductInput,
  UpdateProductInput
} from '../core/validations/product.validation';

const router = Router();

// GET /api/products - Get all products with filtering and pagination
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = productQuerySchema.parse(req.query);
  const { page, limit, search, category, minPrice, maxPrice, inStock, isActive, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.categoryId = category;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

  if (inStock !== undefined) {
    where.stock = inStock ? { gt: 0 } : { lte: 0 };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const orderBy: any = {};
  orderBy[sortBy] = sortOrder;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            altText: true,
            isPrimary: true,
          },
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/products/featured - Get featured products
router.get('/featured', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { limit = '10' } = req.query;
  const limitNum = parseInt(limit as string);

  const products = await prisma.product.findMany({
    where: { 
      isActive: true,
      stock: { gt: 0 }
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limitNum,
  });

  res.json({ products });
}));

// GET /api/products/search - Advanced product search
router.get('/search', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { q, category, minPrice, maxPrice, page = '1', limit = '20' } = req.query;
  
  if (!q) {
    throw new CustomError('Search query is required', 400);
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = {
    AND: [
      {
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
          { slug: { contains: q as string, mode: 'insensitive' } },
        ],
      },
      { isActive: true },
    ],
  };

  if (category) {
    where.AND.push({ categoryId: category as string });
  }

  if (minPrice || maxPrice) {
    const priceFilter: any = {};
    if (minPrice) priceFilter.gte = parseFloat(minPrice as string);
    if (maxPrice) priceFilter.lte = parseFloat(maxPrice as string);
    where.AND.push({ price: priceFilter });
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      orderBy: [
        { stock: 'desc' },
        { createdAt: 'desc' },
      ],
      skip,
      take: limitNum,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    products,
    query: q,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
}));

// GET /api/products/:id - Get product by ID
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
      images: {
        select: {
          id: true,
          imageUrl: true,
          altText: true,
          isPrimary: true,
          createdAt: true,
        },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      },
      reviews: {
        select: {
          id: true,
          rating: true,
          comment: true,
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          reviews: true,
          orderItems: true,
        },
      },
    },
  });

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  res.json({ product });
}));

// POST /api/products - Create product (Admin only)
router.post('/', 
  authenticate, 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // Handle both JSON and multipart form data
    let validatedData: CreateProductInput;
    
    if (req.body.data) {
      // Multipart form data (with file upload)
      validatedData = createProductSchema.parse(JSON.parse(req.body.data)) as CreateProductInput;
    } else {
      // JSON data (without file upload)
      validatedData = createProductSchema.parse(req.body) as CreateProductInput;
    }
    
    const files = req.files as Express.Multer.File[] || [];

    // Validate uploaded files (optional for testing)
    const validFiles = validateUploadedFiles(files, files.length > 0);

    // Check if SKU already exists
    if (validatedData.sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (existingProduct) {
        throw new CustomError('Product with this SKU already exists', 409);
      }
    }

    // Validate category if provided
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category || !category.isActive) {
        throw new CustomError('Invalid or inactive category', 400);
      }
    }

    // Create product with images
    const product = await prisma.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        price: validatedData.price,
        stock: validatedData.stock,
        categoryId: validatedData.categoryId,
        isActive: validatedData.isActive,
        images: {
          create: validFiles.map((file, index) => ({
            imageUrl: getFileUrl(file.filename),
            altText: req.body[`altText_${index}`] || `${validatedData.name} - Image ${index + 1}`,
            isPrimary: index === 0, // First image is primary
          })),
        },
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: true,
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  })
);

// PUT /api/products/:id - Update product (Admin only)
router.put('/:id', 
  authenticate, 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  uploadProductImages,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const validatedData = updateProductSchema.parse(JSON.parse(req.body.data)) as UpdateProductInput;
    const files = req.files as Express.Multer.File[];

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new CustomError('Product not found', 404);
    }

    // Check SKU uniqueness if updating
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const duplicateProduct = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
      });

      if (duplicateProduct) {
        throw new CustomError('Product with this SKU already exists', 409);
      }
    }

    // Validate category if updating
    if (validatedData.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
      });

      if (!category || !category.isActive) {
        throw new CustomError('Invalid or inactive category', 400);
      }
    }

    // Handle new images if uploaded
    let newImages = [];
    if (files && files.length > 0) {
      const validFiles = validateUploadedFiles(files);
      newImages = validFiles.map((file, index) => ({
        imageUrl: getFileUrl(file.filename),
        altText: req.body[`altText_${index}`] || `${validatedData.name || existingProduct.name} - Image ${index + 1}`,
        isPrimary: false, // Will be set based on request
      }));
    }

    // Update product
    const updateData: any = { ...validatedData };
    
    if (newImages.length > 0) {
      updateData.images = {
        create: newImages,
      };
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    res.json({
      message: 'Product updated successfully',
      product,
    });
  })
);

// DELETE /api/products/:id - Delete product (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orderItems: true,
          reviews: true,
        },
      },
    },
  });

  if (!product) {
    throw new CustomError('Product not found', 404);
  }

  // Check if product has orders or reviews
  if (product._count.orderItems > 0) {
    throw new CustomError('Cannot delete product with existing orders', 400);
  }

  // Soft delete by setting isActive to false
  await prisma.product.update({
    where: { id },
    data: { isActive: false },
  });

  res.json({
    message: 'Product deactivated successfully',
  });
}));

// POST /api/products/bulk-update - Bulk update products (Admin only)
router.post('/bulk-update', 
  authenticate, 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = bulkUpdateProductsSchema.parse(req.body);
    const { productIds, updates } = validatedData;

    // Validate category if updating
    if (updates.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: updates.categoryId },
      });

      if (!category || !category.isActive) {
        throw new CustomError('Invalid or inactive category', 400);
      }
    }

    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
      },
      data: updates,
    });

    res.json({
      message: 'Products updated successfully',
      updatedCount: result.count,
    });
  })
);

// POST /api/products/bulk-delete - Bulk delete products (Admin only)
router.post('/bulk-delete', 
  authenticate, 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const validatedData = bulkDeleteProductsSchema.parse(req.body);
    const { productIds } = validatedData;

    // Check if any products have orders
    const productsWithOrders = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        orderItems: {
          some: {},
        },
      },
      select: { id: true },
    });

    if (productsWithOrders.length > 0) {
      throw new CustomError('Cannot delete products with existing orders', 400);
    }

    // Soft delete products
    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
      },
      data: { isActive: false },
    });

    res.json({
      message: 'Products deactivated successfully',
      deactivatedCount: result.count,
    });
  })
);

// GET /api/products/stats - Get product statistics (Admin only)
router.get('/stats', 
  authenticate, 
  authorize('ADMIN', 'SUPER_ADMIN'), 
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      inStockProducts,
      outOfStockProducts,
      lowStockProducts,
      totalCategories,
      productsByCategory,
      recentProducts,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.product.count({ where: { stock: { gt: 0 }, isActive: true } }),
      prisma.product.count({ where: { stock: { lte: 0 }, isActive: true } }),
      prisma.product.count({ where: { stock: { gt: 0, lte: 10 }, isActive: true } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              products: {
                where: { isActive: true },
              },
            },
          },
        },
        orderBy: {
          products: {
            _count: 'desc',
          },
        },
        take: 10,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          createdAt: true,
        },
      }),
    ]);

    res.json({
      stats: {
        overview: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
        },
        inventory: {
          inStock: inStockProducts,
          outOfStock: outOfStockProducts,
          lowStock: lowStockProducts,
        },
        categories: {
          total: totalCategories,
          byCategory: productsByCategory,
        },
        recent: recentProducts,
      },
    });
  })
);

export default router;
