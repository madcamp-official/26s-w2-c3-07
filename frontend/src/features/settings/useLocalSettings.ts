'use client';

import { useEffect, useSyncExternalStore } from 'react';

export type LocalSettings = {
  soundEnabled: boolean;
  musicEnabled: boolean;
};

const STORAGE_KEY = 'satoori:local-settings';
const DEFAULT_SETTINGS: LocalSettings = { soundEnabled: true, musicEnabled: true };
const SERVER_SNAPSHOT = { settings: DEFAULT_SETTINGS, loaded: false };
const listeners = new Set<() => void>();
let settings = DEFAULT_SETTINGS;
let loaded = false;
let snapshot = { settings, loaded };

function emit() {
  snapshot = { settings, loaded };
  listeners.forEach((listener) => listener());
}

function hydrate() {
  if (loaded || typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const stored = raw ? JSON.parse(raw) as Partial<LocalSettings> : {};
    settings = {
      soundEnabled: typeof stored.soundEnabled === 'boolean' ? stored.soundEnabled : true,
      musicEnabled: typeof stored.musicEnabled === 'boolean' ? stored.musicEnabled : true,
    };
  } catch {
    settings = DEFAULT_SETTINGS;
  }
  loaded = true;
  emit();
}

export function updateLocalSettings(next: Partial<LocalSettings>) {
  settings = { ...settings, ...next };
  loaded = true;
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  emit();
}

export function useLocalSettings() {
  const current = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => snapshot,
    () => SERVER_SNAPSHOT,
  );

  useEffect(hydrate, []);
  return { ...current, update: updateLocalSettings };
}
