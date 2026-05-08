import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  createCategorySchema, 
  updateCategorySchema, 
  categoryQuerySchema,
  CreateCategoryInput,
  UpdateCategoryInput
} from '../core/validations/product.validation';

const router = Router();

// GET /api/categories - Get all categories
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = categoryQuerySchema.parse(req.query);
  const { page, limit, search, isActive, parentId } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive' as const,
    };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (parentId) {
    where.parentId = parentId;
  } else if (parentId === null) {
    where.parentId = null;
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.category.count({ where }),
  ]);

  res.json({
    categories,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/categories/tree - Get category tree structure
router.get('/tree', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      children: {
        where: { isActive: true },
        include: {
          children: {
            where: { isActive: true },
          },
        },
      },
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Build tree structure (only root categories)
  const tree = categories
    .filter(cat => !cat.parentId)
    .map(category => ({
      ...category,
      children: category.children.map(child => ({
        ...child,
        children: child.children,
      })),
    }));

  res.json({ tree });
}));

// GET /api/categories/:id - Get category by ID
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      children: {
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
        orderBy: { name: 'asc' },
      },
      products: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
        take: 10,
      },
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  });

  if (!category) {
    throw new CustomError('Category not found', 404);
  }

  res.json({ category });
}));

// POST /api/categories - Create category (Admin only)
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedData = createCategorySchema.parse(req.body) as CreateCategoryInput;
  const { name, description, isActive, parentId } = validatedData;

  // Check if category name already exists (within same parent)
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
      parentId: parentId || null,
    },
  });

  if (existingCategory) {
    throw new CustomError('Category with this name already exists in this level', 409);
  }

  // Validate parent category if provided
  if (parentId) {
    const parentCategory = await prisma.category.findUnique({
      where: { id: parentId },
    });

    if (!parentCategory) {
      throw new CustomError('Parent category not found', 404);
    }

    if (!parentCategory.isActive) {
      throw new CustomError('Parent category is not active', 400);
    }
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description,
      isActive,
      parentId,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  });

  res.status(201).json({
    message: 'Category created successfully',
    category,
  });
}));

// PUT /api/categories/:id - Update category (Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateCategorySchema.parse(req.body) as UpdateCategoryInput;

  // Check if category exists
  const existingCategory = await prisma.category.findUnique({
    where: { id },
  });

  if (!existingCategory) {
    throw new CustomError('Category not found', 404);
  }

  // Check if name already exists (if updating name)
  if (validatedData.name && validatedData.name !== existingCategory.name) {
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
        parentId: validatedData.parentId ?? existingCategory.parentId,
        id: { not: id },
      },
    });

    if (duplicateCategory) {
      throw new CustomError('Category with this name already exists in this part', 409);
    }
  }

  // Validate parent category if updating
  if (validatedData.parentId) {
    if (validatedData.parentId === id) {
      throw new CustomError('Category cannot be its own parent', 400);
    }

    const parentCategory = await prisma.category.findUnique({
      where: { id: validatedData.parentId },
    });

    if (!parentCategory) {
      throw new CustomError('Parent category not found', 404);
    }

    if (!parentCategory.isActive) {
      throw new CustomError('Parent category is not active', 400);
    }

    // Check if this would create a circular reference
    const isDescendant = await checkIsDescendant(validatedData.parentId, id);
    if (isDescendant) {
      throw new CustomError('Cannot set parent to a descendant category', 400);
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data: validatedData,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          isActive: true,
        },
      },
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  });

  res.json({
    message: 'Category updated successfully',
    category,
  });
}));

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  // Check if category exists
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
  });

  if (!category) {
    throw new CustomError('Category not found', 404);
  }

  // Check if category has products
  if (category._count.products > 0) {
    throw new CustomError('Cannot delete category with existing products', 400);
  }

  // Check if category has children
  if (category._count.children > 0) {
    throw new CustomError('Cannot delete category with subcategories', 400);
  }

  await prisma.category.delete({
    where: { id },
  });

  res.json({
    message: 'Category deleted successfully',
  });
}));

// Helper function to check if a category is a descendant of another
async function checkIsDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
  const category = await prisma.category.findUnique({
    where: { id: descendantId },
    include: { parent: true },
  });

  if (!category || !category.parent) {
    return false;
  }

  if (category.parent.id === ancestorId) {
    return true;
  }

  return checkIsDescendant(ancestorId, category.parent.id);
}

export default router;
