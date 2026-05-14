import { Response } from 'express';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SuccessOptions<T> {
  res: Response;
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  statusCode?: number;
}

interface ErrorOptions {
  res: Response;
  message: string;
  statusCode?: number;
  errors?: Array<{ field: string; message: string }>;
}

export function sendSuccess<T>({
  res,
  message = 'Success',
  data,
  meta,
  statusCode = 200,
}: SuccessOptions<T>): void {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  });
}

export function sendError({ res, message, statusCode = 500, errors }: ErrorOptions): void {
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
}

export function paginate(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function parsePagination(query: { page?: string; limit?: string }): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
