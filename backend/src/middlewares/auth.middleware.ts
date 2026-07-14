import type { NextFunction, Request, Response } from 'express';
import { verifyUserToken } from '../config/supabase.js';
import { AppError } from '../shared/errors/app-error.js';

type TokenUser = { id: string; email?: string | null };
type TokenVerifier = (token: string) => Promise<TokenUser | null>;

const extractBearerToken = (authorization: string | undefined) => {
  if (!authorization) throw new AppError(401, 'Authorization token is required', 'AUTH_TOKEN_REQUIRED');
  const match = /^Bearer\s+(\S+)$/i.exec(authorization);
  if (!match || match[1].split('.').length !== 3) throw new AppError(401, 'Authorization token is invalid', 'AUTH_TOKEN_INVALID');
  return match[1];
};

const authenticate = async (req: Request, verifier: TokenVerifier, required: boolean) => {
  const authorization = req.header('authorization');
  if (!authorization && !required) return;
  const token = extractBearerToken(authorization);
  const user = await verifier(token);
  if (!user) throw new AppError(401, 'Authorization token is invalid', 'AUTH_TOKEN_INVALID');
  req.user = { id: user.id, email: user.email ?? null };
};

export const createRequireAuth = (verifier: TokenVerifier = verifyUserToken) => async (req: Request, _res: Response, next: NextFunction) => {
  try {
    await authenticate(req, verifier, true);
    next();
  } catch (error) {
    next(error);
  }
};

export const createOptionalAuth = (verifier: TokenVerifier = verifyUserToken) => async (req: Request, _res: Response, next: NextFunction) => {
  try {
    await authenticate(req, verifier, false);
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAuth = createRequireAuth();
export const optionalAuth = createOptionalAuth();
export const authMiddleware = requireAuth;
