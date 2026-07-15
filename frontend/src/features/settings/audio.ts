export const BGM_TRACKS = {
  home: '/sounds/bgm/home-theme.mp3',
  investigation: '/sounds/bgm/investigation-theme.mp3',
  interrogation: '/sounds/bgm/interrogation-theme.mp3',
} as const;

export type BgmTrack = keyof typeof BGM_TRACKS;

export const SFX = {
  keyboard: '/sounds/effects/keyboard-type.mp3',
} as const;

export type SfxName = keyof typeof SFX | 'click' | 'select' | 'evidence' | 'submit' | 'success' | 'failure';

let bgmAudio: HTMLAudioElement | null = null;
let currentTrack: BgmTrack | null = null;
let bgmEnabled = true;
let effectsContext: AudioContext | null = null;

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
  if (name === 'keyboard') {
    const audio = new Audio(SFX.keyboard);
    audio.volume = 0.7;
    void audio.play().catch(() => undefined);
    return;
  }
  effectsContext ??= new AudioContext();
  const context = effectsContext;
  const patterns: Record<Exclude<SfxName, 'keyboard'>, number[]> = {
    click: [260], select: [330, 440], evidence: [520, 660], submit: [220, 330, 440],
    success: [392, 523, 659], failure: [330, 247, 196],
  };
  void context.resume().then(() => {
    patterns[name].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.09;
      oscillator.type = name === 'failure' ? 'sawtooth' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.15);
    });
  }).catch(() => undefined);
}
