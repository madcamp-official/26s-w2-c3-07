import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../shared/errors/app-error.js';

export const validateBody = (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join(', ');
    next(new AppError(400, message, 'VALIDATION_ERROR'));
    return;
  }
  req.body = result.data;
  next();
};
