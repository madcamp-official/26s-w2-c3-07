import { afterEach, describe, expect, it, vi } from 'vitest';
import { authRepository } from '../src/modules/auth/auth.repository.js';
import { authService } from '../src/modules/auth/auth.service.js';
import { signInSchema, updateProfileSchema, updateSettingsSchema } from '../src/modules/auth/auth.schema.js';
import { validateBody } from '../src/middlewares/validate.middleware.js';
import type { NextFunction, Request, Response } from 'express';

afterEach(() => vi.restoreAllMocks());

describe('auth service', () => {
  it('uses only the verified user id to read a profile', async () => {
    const spy = vi.spyOn(authRepository, 'getProfile').mockResolvedValue({ userId: 'user-1', displayName: 'Kim', avatarUrl: null });
    await expect(authService.me({ id: 'user-1', email: 'user@example.com' })).resolves.toMatchObject({ userId: 'user-1' });
    expect(spy).toHaveBeenCalledWith('user-1');
  });
  it('uses only the verified user id to update a profile', async () => {
    const spy = vi.spyOn(authRepository, 'updateProfile').mockResolvedValue({ userId: 'user-1', displayName: 'New', avatarUrl: null });
    await authService.updateMe({ id: 'user-1', email: null }, { displayName: 'New' });
    expect(spy).toHaveBeenCalledWith('user-1', { displayName: 'New' });
  });
  it('reads and updates settings for the verified user', async () => {
    const settings = { userId: 'user-1', soundEnabled: true, musicEnabled: false, textSpeed: 'normal', locale: 'ko' };
    const get = vi.spyOn(authRepository, 'getSettings').mockResolvedValue(settings);
    const update = vi.spyOn(authRepository, 'updateSettings').mockResolvedValue(settings);
    await authService.settings({ id: 'user-1', email: null });
    await authService.updateSettings({ id: 'user-1', email: null }, { musicEnabled: false });
    expect(get).toHaveBeenCalledWith('user-1');
    expect(update).toHaveBeenCalledWith('user-1', { musicEnabled: false });
  });
  it('rejects access without a verified user', () => expect(() => authService.me(undefined)).toThrowError(expect.objectContaining({ code: 'AUTH_USER_NOT_FOUND' })));
});

describe('auth input validation', () => {
  it('validates email and password', () => expect(signInSchema.safeParse({ email: 'bad', password: '1' }).success).toBe(false));
  it('validates profile fields', () => expect(updateProfileSchema.safeParse({ avatarUrl: 'not-a-url' }).success).toBe(false));
  it('validates setting values', () => expect(updateSettingsSchema.safeParse({ textSpeed: 'instant' }).success).toBe(false));
  it('returns a validation error through middleware', () => {
    const next = vi.fn() as unknown as NextFunction;
    validateBody(signInSchema)({ body: { email: 'bad', password: '1' } } as Request, {} as Response, next);
    expect(vi.mocked(next).mock.calls[0][0]).toMatchObject({ statusCode: 400, code: 'VALIDATION_ERROR' });
  });
});
