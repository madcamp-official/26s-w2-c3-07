export const BGM_TRACKS = {
  home: '/sounds/bgm/home-theme.mp3',
  investigation: '/sounds/bgm/investigation-theme.mp3',
  interrogation: '/sounds/bgm/interrogation-theme.mp3',
  mysteryCellar: '/sounds/bgm/mystery-cellar-theme.mp3',
  madohi: '/sounds/bgm/madohi-theme.mp3',
} as const;

export type BgmTrack = keyof typeof BGM_TRACKS;

export const SFX = {
  keyboard: '/sounds/effects/keyboard-type.mp3',
  click: '/sounds/effects/click.mp3',
} as const;

export type SfxName = keyof typeof SFX;

let bgmAudio: HTMLAudioElement | null = null;
let currentTrack: BgmTrack | null = null;
let bgmEnabled = true;

export function setBgmEnabled(enabled: boolean) {
  bgmEnabled = enabled;
  if (!bgmAudio) return;
  if (enabled) {
    void bgmAudio.play().catch(() => undefined);
  } else {
    bgmAudio.pause();
  }
}

export function playBgm(track: BgmTrack) {
  if (typeof window === 'undefined') return;
  if (currentTrack === track && bgmAudio) return;
  currentTrack = track;
  if (bgmAudio) {
    bgmAudio.pause();
  }
  const audio = new Audio(BGM_TRACKS[track]);
  audio.loop = true;
  audio.volume = 0.4;
  bgmAudio = audio;
  if (bgmEnabled) {
    void audio.play().catch(() => undefined);
  }
}

export function stopBgm() {
  currentTrack = null;
  bgmAudio?.pause();
  bgmAudio = null;
}

export function playSfx(name: SfxName, enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  const audio = new Audio(SFX[name]);
  audio.volume = 0.7;
  void audio.play().catch(() => undefined);
}
