'use client';

import { useEffect } from 'react';
import { playSfx } from './audio';
import { useSfxEnabled } from './useBgm';

export function GlobalClickSound() {
  const enabled = useSfxEnabled();

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest<HTMLElement>('button, a, [role="button"]');
      if (!trigger || trigger.getAttribute('aria-disabled') === 'true' || trigger.hasAttribute('disabled') || trigger.dataset.sfx === 'custom') return;
      playSfx('click', enabled);
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [enabled]);

  return null;
}
