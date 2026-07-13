import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../src/shared/errors/app-error.js';
import { createOptionalAuth, createRequireAuth } from '../src/middlewares/auth.middleware.js';

const request = (authorization?: string) => ({ header: vi.fn(() => authorization) }) as unknown as Request;
const run = async (middleware: ReturnType<typeof createRequireAuth>, req: Request) => {
  const next = vi.fn() as unknown as NextFunction;
  await middleware(req, {} as Response, next);
  return vi.mocked(next);
};

describe('authentication middleware', () => {
  it('rejects a missing token', async () => {
    const next = await run(createRequireAuth(vi.fn()), request());
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'AUTH_TOKEN_REQUIRED' });
  });
  it('rejects a malformed bearer token without calling Supabase', async () => {
    const verifier = vi.fn();
    const next = await run(createRequireAuth(verifier), request('Bearer invalid'));
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'AUTH_TOKEN_INVALID' });
    expect(verifier).not.toHaveBeenCalled();
  });
  it('rejects a token Supabase cannot verify', async () => {
    const next = await run(createRequireAuth(async () => null), request('Bearer header.payload.signature'));
    expect(next.mock.calls[0][0]).toMatchObject({ code: 'AUTH_TOKEN_INVALID' });
  });
  it('stores verified id and email', async () => {
    const req = request('Bearer header.payload.signature');
    const next = await run(createRequireAuth(async () => ({ id: 'user-1', email: 'user@example.com' })), req);
    expect(req.user).toEqual({ id: 'user-1', email: 'user@example.com' });
    expect(next).toHaveBeenCalledWith();
  });
  it('allows an anonymous request through optional auth', async () => {
    const req = request(); const next = vi.fn();
    await createOptionalAuth(vi.fn())(req, {} as Response, next);
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });
});
