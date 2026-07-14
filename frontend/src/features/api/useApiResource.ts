'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { ApiError } from '@/types/api';

export function useApiResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!path) { setLoading(false); return null; }
    setLoading(true); setError(null);
    try { const next = await api.get<T>(path, { signal }); setData(next); return next; }
    catch (cause) { if (!(cause instanceof DOMException && cause.name === 'AbortError')) setError(cause instanceof ApiError ? cause : new ApiError(0, 'UNKNOWN_ERROR', '요청 처리에 실패했습니다.', 'unknown')); return null; }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [path]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);
  return { data, setData, error, loading, reload: () => load() };
}
