import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../shared/types/express.types.js';

export const authMiddleware = (req: AuthedRequest, _res: Response, next: NextFunction) => {
  const userId = req.header('x-user-id');
  if (userId) req.user = { id: userId };
  next();
};
