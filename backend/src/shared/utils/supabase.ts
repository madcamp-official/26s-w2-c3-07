import type { PostgrestError } from '@supabase/supabase-js';
import { AppError } from '../errors/app-error.js';

const statusByCode: Record<string, number> = {
  '23503': 409,
  '23505': 409,
  '42501': 403,
  PGRST116: 404
};

export const toAppError = (error: Pick<PostgrestError, 'code' | 'message'>, fallback = 'Database operation failed') =>
  new AppError(statusByCode[error.code] ?? 500, fallback, `DB_${error.code || 'UNKNOWN'}`);

export const requireSingle = <T>(data: T | null, error: PostgrestError | null, message = 'Resource not found'): T => {
  if (error) throw toAppError(error, message);
  if (data === null) throw new AppError(404, message, 'NOT_FOUND');
  return data;
};

export const assertOwnedBy = (ownerId: string, userId: string, resource = 'Resource'): void => {
  if (ownerId !== userId) throw new AppError(403, `${resource} does not belong to the authenticated user`, 'FORBIDDEN');
};
