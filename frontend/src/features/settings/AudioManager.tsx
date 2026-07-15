'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { playBgm, setBgmEnabled, type BgmTrack } from './audio';
import { useLocalSettings } from './useLocalSettings';
import { GlobalClickSound } from './GlobalClickSound';

function trackFor(pathname: string): BgmTrack {
  if (pathname.endsWith('/result')) return 'madohi';
  if (pathname.endsWith('/records') || pathname.endsWith('/deduction') || pathname.endsWith('/suspects')) return 'mysteryCellar';
  if (pathname.includes('/interrogation/')) return 'interrogation';
  if (pathname.startsWith('/game/') || pathname.startsWith('/episodes/')) return 'investigation';
  return 'home';
}

export function AudioManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { settings, loaded } = useLocalSettings();

  useEffect(() => {
    if (!loaded) return;
    setBgmEnabled(settings.musicEnabled);
    playBgm(trackFor(pathname));
  }, [loaded, pathname, settings.musicEnabled]);

  return <><GlobalClickSound />{children}</>;
}
