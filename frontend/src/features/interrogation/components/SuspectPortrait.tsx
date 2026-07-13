import type { PublicSuspect } from '@/types/content';

export function SuspectPortrait({ suspect }: { suspect: PublicSuspect }) {
  return <div className="mx-auto grid h-72 w-full max-w-md place-items-center bg-[radial-gradient(circle_at_50%_25%,#3a322a_0%,#1a1510_55%,#0a0806_100%)] font-display text-7xl text-parchment-300/30 md:h-80" aria-label={`${suspect.name} 용의자 초상`}>{suspect.name.slice(0, 1)}</div>;
}
