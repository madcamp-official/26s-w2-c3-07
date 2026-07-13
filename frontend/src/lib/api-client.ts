import { getSupabaseClient } from '@/lib/supabase-client';
import { ApiError, type ApiFailure, type ApiResponse, type HttpMethod } from '@/types/api';

type RequestOptions = { body?: unknown; signal?: AbortSignal; token?: string | null };

const category = (status: number): ApiError['category'] => ({
  400: 'validation', 401: 'unauthorized', 403: 'forbidden', 404: 'not-found', 409: 'conflict', 429: 'rate-limited', 500: 'server'
}[status] as ApiError['category'] | undefined) ?? (status >= 500 ? 'server' : 'unknown');

function endpoint(path: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000').replace(/\/$/, '');
  const prefix = base.endsWith('/api') ? base : `${base}/api`;
  return `${prefix}${path.startsWith('/') ? path : `/${path}`}`;
}

async function accessToken(explicit?: string | null): Promise<string | null> {
  if (explicit !== undefined) return explicit;
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const token = await accessToken(options.token);
  const headers = new Headers({ Accept: 'application/json' });
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(endpoint(path), { method, headers, body: options.body === undefined ? undefined : JSON.stringify(options.body), signal: options.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.', 'network');
  }
  if (response.status === 204) return undefined as T;
  let payload: ApiResponse<T> | null = null;
  try { payload = await response.json() as ApiResponse<T>; } catch { /* handled below */ }
  if (!response.ok || !payload || payload.success === false) {
    const failure = payload as ApiFailure | null;
    const error = new ApiError(response.status, failure?.error.code ?? `HTTP_${response.status}`, failure?.error.message ?? response.statusText ?? 'Request failed', category(response.status));
    if (response.status === 401 && !path.startsWith('/auth/sign-') && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('satoori:unauthorized'));
    throw error;
  }
  return payload.data;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => apiRequest<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) => apiRequest<T>('POST', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) => apiRequest<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'body'>) => apiRequest<T>('DELETE', path, options)
};
