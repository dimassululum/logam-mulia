import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role } from '@prisma/client';

// Extend Express Request to include user payload
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
      };
    }
  }
}

/**
 * Middleware: Verify JWT access token.
 * Attaches decoded user to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token tidak ditemukan');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role as Role,
    };
    next();
  } catch {
    throw new UnauthorizedError('Token tidak valid atau sudah kedaluwarsa');
  }
}

/**
 * Middleware factory: Restrict to specific roles.
 * Usage: requireRole('ADMIN', 'SUPER_ADMIN')
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError();
    }
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Anda tidak memiliki akses ke resource ini');
    }
    next();
  };
}

// Shorthand middlewares
export const isAdmin = requireRole(Role.ADMIN, Role.SUPER_ADMIN);
export const isSuperAdmin = requireRole(Role.SUPER_ADMIN);
