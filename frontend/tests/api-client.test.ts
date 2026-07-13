import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase-client', () => ({
  getSupabaseClient: () => ({ auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'token-1' } } }) } })
}));

import { api } from '@/lib/api-client';

afterEach(() => vi.unstubAllGlobals());

describe('api client', () => {
  it('unwraps successful JSON responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { id: 'region-1' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    await expect(api.get<{ id: string }>('/regions')).resolves.toEqual({ id: 'region-1' });
  });
  it('adds the current Supabase access token', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    await api.get('/progress');
    expect((fetcher.mock.calls[0][1] as RequestInit).headers).toMatchObject(expect.any(Headers));
    expect(((fetcher.mock.calls[0][1] as RequestInit).headers as Headers).get('Authorization')).toBe('Bearer token-1');
  });
  it('preserves backend status, code, and message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: { code: 'SESSION_EXPIRED', message: 'Session expired' } }), { status: 409 })));
    await expect(api.post('/sessions/id/interrogations', {})).rejects.toMatchObject({ status: 409, code: 'SESSION_EXPIRED', message: 'Session expired', category: 'conflict' });
  });
  it('handles 204 and network failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })).mockRejectedValueOnce(new TypeError('offline')));
    await expect(api.delete('/sessions/id/notes/id')).resolves.toBeUndefined();
    await expect(api.get('/regions')).rejects.toMatchObject({ code: 'NETWORK_ERROR', category: 'network' });
  });
  it('forwards AbortSignal', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }));
    vi.stubGlobal('fetch', fetcher); const controller = new AbortController(); await api.get('/regions', { signal: controller.signal });
    expect((fetcher.mock.calls[0][1] as RequestInit).signal).toBe(controller.signal);
  });
});
