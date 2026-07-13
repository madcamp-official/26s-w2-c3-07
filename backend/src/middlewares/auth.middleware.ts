import type { NextFunction, Response } from 'express';
import type { AuthedRequest } from '../shared/types/express.types.js';
import { verifyUserToken } from '../config/supabase.js';
import { AppError } from '../shared/errors/app-error.js';

export const authMiddleware = async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  try {
    const authorization = req.header('authorization');
    if (!authorization?.startsWith('Bearer ')) throw new AppError(401, 'Bearer token is required', 'UNAUTHORIZED');
    const user = await verifyUserToken(authorization.slice(7));
    if (!user) throw new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED');
    req.user = { id: user.id };
    next();
  } catch (error) {
    next(error);
  }
};
