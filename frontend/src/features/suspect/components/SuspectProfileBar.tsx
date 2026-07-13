import type { PublicSuspect } from '@/types/content';

export function SuspectProfileBar({ suspect }: { suspect: PublicSuspect }) {
  return <div className="flex flex-1 items-center gap-4 border border-brass-600/40 bg-noir-800/85 px-5 py-4"><span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center border border-brass-600/40 bg-noir-900/70 text-lg">?</span><p className="text-sm text-parchment-200 md:text-base"><span className="font-display font-bold text-parchment-100">{suspect.name}</span><span className="mx-2 text-brass-500/60">|</span>{suspect.age ? `${suspect.age}세` : '나이 미상'}<span className="mx-2 text-brass-500/60">|</span>{suspect.occupation ?? '직업 미상'}<span className="mx-2 text-brass-500/60">|</span>{suspect.victimRelation ?? '관계 미상'}</p></div>;
}
