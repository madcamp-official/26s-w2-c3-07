import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BGM_TRACKS, SFX } from '../src/features/settings/audio';

describe('game audio assets', () => {
  it.each(Object.entries(BGM_TRACKS))('maps the %s BGM to an existing file', (_track, path) => {
    expect(existsSync(resolve(import.meta.dirname, '../public', path.slice(1)))).toBe(true);
  });

  it.each(Object.entries(SFX))('maps the %s effect to an existing file', (_effect, path) => {
    expect(existsSync(resolve(import.meta.dirname, '../public', path.slice(1)))).toBe(true);
  });
});
