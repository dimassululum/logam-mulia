import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(422).json({
      success: false,
      message: 'Validasi gagal',
      errors,
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `Ukuran file terlalu besar. Maksimal ${env.MAX_FILE_SIZE_MB}MB.`
      : 'Upload file gagal. Periksa file yang diunggah.';

    res.status(413).json({
      success: false,
      message,
    });
    return;
  }

  // Prisma errors
  if (err instanceof Error && err.constructor.name.startsWith('Prisma')) {
    logger.error('Prisma error', { message: err.message, url: req.url });

    // Unique constraint violation (P2002)
    if ((err as any).code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Data sudah ada, gunakan nilai yang berbeda',
      });
      return;
    }

    // Record not found (P2025)
    if ((err as any).code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Data tidak ditemukan',
      });
      return;
    }
  }

  // Unknown errors
  logger.error('Unhandled error', {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    ...(env.IS_DEVELOPMENT && {
      debug: err instanceof Error ? err.message : String(err),
    }),
  });
}
