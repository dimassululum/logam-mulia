import { Router, Response } from 'express';
import { prisma } from '../index';
import { authenticate, authorize, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { CustomError } from '../core/middlewares/error.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import { 
  createContentSchema, 
  updateContentSchema, 
  contentQuerySchema,
  CreateContentInput,
  UpdateContentInput,
  ContentQueryInput
} from '../core/validations/admin.validation';

const router = Router();

// GET /api/contents - Get all contents (Admin only)
router.get('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const validatedQuery = contentQuerySchema.parse(req.query) as ContentQueryInput;
  const { page, limit, type, status, search, authorId, sortBy, sortOrder } = validatedQuery;
  
  const skip = (page - 1) * limit;

  const where: any = {};
  
  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (authorId) {
    where.authorId = authorId;
  }

  const [contents, total] = await Promise.all([
    prisma.content.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.content.count({ where }),
  ]);

  res.json({
    contents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// GET /api/contents/public - Get published contents for public
router.get('/public', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { type, slug } = req.query;
  
  const where: any = {
    status: 'published',
  };

  if (type) {
    where.type = type;
  }

  if (slug) {
    where.slug = slug;
  }

  const contents = await prisma.content.findMany({
    where,
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      type: true,
      imageUrl: true,
      seoTitle: true,
      seoDesc: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (slug && contents.length > 0) {
    res.json({ content: contents[0] });
    return;
  }

  res.json({ contents });
}));

// GET /api/contents/:id - Get content by ID (Admin only)
router.get('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const content = await prisma.content.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!content) {
    throw new CustomError('Content not found', 404);
  }

  res.json({ content });
}));

// GET /api/contents/slug/:slug - Get content by slug (Public)
router.get('/slug/:slug', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { slug } = req.params;

  const content = await prisma.content.findUnique({
    where: { 
      slug,
      status: 'published',
    },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      type: true,
      imageUrl: true,
      seoTitle: true,
      seoDesc: true,
      createdAt: true,
      updatedAt: true,
      author: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!content) {
    throw new CustomError('Content not found', 404);
  }

  res.json({ content });
}));

// POST /api/contents - Create content (Admin only)
router.post('/', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const validatedData = createContentSchema.parse(req.body) as CreateContentInput;
  const { slug, title, content, excerpt, type, status, imageUrl, seoTitle, seoDesc } = validatedData;

  const existingContent = await prisma.content.findUnique({
    where: { slug },
  });

  if (existingContent) {
    throw new CustomError('Content with this slug already exists', 409);
  }

  const newContent = await prisma.content.create({
    data: {
      slug,
      title,
      content,
      excerpt,
      type,
      status,
      imageUrl,
      seoTitle,
      seoDesc,
      authorId: userId,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  res.status(201).json({
    message: 'Content created successfully',
    content: newContent,
  });
}));

// PUT /api/contents/:id - Update content (Admin only)
router.put('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const validatedData = updateContentSchema.parse(req.body) as UpdateContentInput;

  const existingContent = await prisma.content.findUnique({
    where: { id },
  });

  if (!existingContent) {
    throw new CustomError('Content not found', 404);
  }

  if (validatedData.slug && validatedData.slug !== existingContent.slug) {
    const duplicateContent = await prisma.content.findUnique({
      where: { slug: validatedData.slug },
    });

    if (duplicateContent) {
      throw new CustomError('Content with this slug already exists', 409);
    }
  }

  const content = await prisma.content.update({
    where: { id },
    data: validatedData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  res.json({
    message: 'Content updated successfully',
    content,
  });
}));

// DELETE /api/contents/:id - Delete content (Admin only)
router.delete('/:id', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const content = await prisma.content.findUnique({
    where: { id },
  });

  if (!content) {
    throw new CustomError('Content not found', 404);
  }

  await prisma.content.delete({
    where: { id },
  });

  res.json({
    message: 'Content deleted successfully',
  });
}));

// POST /api/contents/:id/publish - Publish content (Admin only)
router.post('/:id/publish', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const content = await prisma.content.findUnique({
    where: { id },
  });

  if (!content) {
    throw new CustomError('Content not found', 404);
  }

  const updatedContent = await prisma.content.update({
    where: { id },
    data: {
      status: 'published',
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  res.json({
    message: 'Content published successfully',
    content: updatedContent,
  });
}));

// POST /api/contents/:id/unpublish - Unpublish content (Admin only)
router.post('/:id/unpublish', authenticate, authorize('ADMIN', 'SUPER_ADMIN'), asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const content = await prisma.content.findUnique({
    where: { id },
  });

  if (!content) {
    throw new CustomError('Content not found', 404);
  }

  const updatedContent = await prisma.content.update({
    where: { id },
    data: {
      status: 'draft',
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  res.json({
    message: 'Content unpublished successfully',
    content: updatedContent,
  });
}));

export default router;
