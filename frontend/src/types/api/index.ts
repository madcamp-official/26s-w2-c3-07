export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = { success: false; error: { code: string; message: string } };
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly category: 'validation' | 'unauthorized' | 'forbidden' | 'not-found' | 'conflict' | 'rate-limited' | 'server' | 'network' | 'unknown'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
