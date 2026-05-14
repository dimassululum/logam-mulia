import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

type ValidateTarget = 'body' | 'query' | 'params';

/**
 * Middleware factory: Validate request data against a Zod schema.
 * Throws ZodError on failure — caught by global error handler.
 */
export function validate(schema: ZodSchema, target: ValidateTarget = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    schema.parse(req[target]);
    next();
  };
}
