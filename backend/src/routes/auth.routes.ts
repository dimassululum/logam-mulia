import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../index';
import { JWTService } from '../core/utils/jwt';
import { CustomError } from '../core/middlewares/error.middleware';
import { authenticate, AuthenticatedRequest } from '../core/middlewares/auth.middleware';
import { asyncHandler } from '../core/middlewares/error.middleware';
import EmailService from '../core/utils/email';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// POST /api/auth/register
router.post('/register', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Validate input
  const validatedData = registerSchema.parse(req.body);
  const { name, email, password, phone } = validatedData;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new CustomError('User with this email already exists', 409);
  }

  // Hash password
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      phone,
      role: 'CUSTOMER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isKycVerified: true,
      createdAt: true,
    },
  });

  // Send welcome email
  try {
    EmailService.sendWelcomeEmail(user.name, user.email).catch(error => {
      console.error('Failed to send welcome email:', error);
    });
  } catch (emailError) {
    console.error('Welcome email preparation failed:', emailError);
    // Don't fail registration if email fails
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const tokens = JWTService.generateTokenPair(tokenPayload);

  res.status(201).json({
    message: 'User registered successfully',
    user,
    tokens,
  });
}));

// GET /api/auth/login - Returns login info or redirects
router.get('/login', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.json({
    message: 'Login endpoint - Use POST method to authenticate',
    method: 'POST',
    endpoint: '/api/auth/login',
    body: {
      email: 'string',
      password: 'string'
    }
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Validate input
  const validatedData = loginSchema.parse(req.body);
  const { email, password } = validatedData;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new CustomError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new CustomError('Account is deactivated', 401);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new CustomError('Invalid email or password', 401);
  }

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const tokens = JWTService.generateTokenPair(tokenPayload);

  // Return user data (without sensitive info)
  const userResponse = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isKycVerified: user.isKycVerified,
    createdAt: user.createdAt,
  };

  res.json({
    message: 'Login successful',
    user: userResponse,
    tokens,
  });
}));

// POST /api/auth/refresh
router.post('/refresh', asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Validate input
  const validatedData = refreshTokenSchema.parse(req.body);
  const { refreshToken } = validatedData;

  // Verify refresh token
  const decoded = JWTService.verifyRefreshToken(refreshToken);

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    throw new CustomError('Invalid refresh token', 401);
  }

  // Generate new tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const tokens = JWTService.generateTokenPair(tokenPayload);

  res.json({
    message: 'Tokens refreshed successfully',
    tokens,
  });
}));

// GET /api/auth/me - Get current user
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isKycVerified: true,
      ktpUrl: true,
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
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new CustomError('User not found', 404);
  }

  res.json({
    user,
  });
}));

// PUT /api/auth/profile - Update profile
router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { name, phone } = req.body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (phone !== undefined) updateData.phone = phone;

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      isKycVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.json({
    message: 'Profile updated successfully',
    user,
  });
}));

// POST /api/auth/logout
router.post('/logout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // In a real implementation, you might want to invalidate the refresh token
  // by storing it in a blacklist or using a token store
  res.json({
    message: 'Logout successful',
  });
}));

export default router;
