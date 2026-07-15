'use client';

import { useEffect } from 'react';
import { useLocalSettings } from '@/features/settings/useLocalSettings';
import { playBgm, setBgmEnabled, type BgmTrack } from '@/features/settings/audio';

export function useBgm(track: BgmTrack) {
  const { settings, loaded } = useLocalSettings();

  useEffect(() => {
    if (!loaded) return;
    playBgm(track);
  }, [track, loaded]);

  useEffect(() => {
    setBgmEnabled(settings.musicEnabled);
  }, [settings.musicEnabled]);
}

export function useSfxEnabled(): boolean {
  const { settings } = useLocalSettings();
  return settings.soundEnabled;
}
