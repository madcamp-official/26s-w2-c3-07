'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useApiResource } from '@/features/api/useApiResource';
import type { SessionRoute } from '@/types/session';

export function useResolvedSessionRoute(routeKey: string, scope: 'active' | 'completed' = 'active') {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const route = useApiResource<SessionRoute>(`/sessions/resolve/${encodeURIComponent(routeKey)}?scope=${scope}`);

  useEffect(() => {
    if (!route.data || routeKey === route.data.episodeCode) return;
    const canonicalPath = pathname.replace(`/game/${routeKey}`, `/game/${route.data.episodeCode}`);
    const query = searchParams.toString();
    router.replace(query ? `${canonicalPath}?${query}` : canonicalPath);
  }, [pathname, route.data, routeKey, router, searchParams]);

  return route;
}
