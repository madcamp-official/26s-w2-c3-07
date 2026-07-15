'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { SessionView } from '@/types/session';

export function useSessionExpiry(session: SessionView | null, sessionId: string, autoNavigate: boolean) {
  const router = useRouter();
  const [remainingSeconds, setRemainingSeconds] = useState(session?.remainingSeconds ?? 0);
  const [showExpiryNotice, setShowExpiryNotice] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!session) return;
    let navigationTimer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      const next = session.status === 'EXPIRED' ? 0 : Math.max(0, Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0 && !['COMPLETED', 'ABANDONED'].includes(session.status) && !handledRef.current) {
        handledRef.current = true;
        setShowExpiryNotice(true);
        navigationTimer = setTimeout(() => {
          if (autoNavigate) router.replace(`/game/${sessionId}`);
          else setShowExpiryNotice(false);
        }, 1500);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => { clearInterval(interval); if (navigationTimer) clearTimeout(navigationTimer); };
  }, [autoNavigate, router, session, sessionId]);

  return { remainingSeconds, showExpiryNotice };
}
