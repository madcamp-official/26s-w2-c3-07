'use client';

import { useEffect } from 'react';
import { playSfx } from '@/features/settings/audio';
import { useSfxEnabled } from '@/features/settings/useBgm';

export function GlobalClickSound() {
  const sfxEnabled = useSfxEnabled();

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const trigger = target?.closest('button, a, [role="button"]') as HTMLButtonElement | null;
      if (!trigger || trigger.disabled) return;
      playSfx('click', sfxEnabled);
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [sfxEnabled]);

  return null;
}
