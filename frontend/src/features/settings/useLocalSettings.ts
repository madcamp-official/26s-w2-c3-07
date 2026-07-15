'use client';

import { useEffect, useState } from 'react';

export type LocalSettings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
  textSpeed: 'slow' | 'normal' | 'fast';
};

const STORAGE_KEY = 'satoori:local-settings';

const DEFAULT_SETTINGS: LocalSettings = {
  soundEnabled: true,
  musicEnabled: true,
  textSpeed: 'normal',
};

function readSettings(): LocalSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useLocalSettings() {
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSettings(readSettings());
    setLoaded(true);
  }, []);

  function update(next: Partial<LocalSettings>) {
    setSettings((prev) => {
      const merged = { ...prev, ...next };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      return merged;
    });
  }

  return { settings, update, loaded };
}
