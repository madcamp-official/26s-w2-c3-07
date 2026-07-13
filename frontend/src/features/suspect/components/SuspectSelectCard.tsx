import type { PublicSuspect } from '@/types/content';
import type { SessionView } from '@/types/session';

type SuspectSelectCardProps = { suspect: PublicSuspect; state?: SessionView['suspectStates'][number]; isSelected?: boolean; disabled?: boolean; onSelect: (suspectId: string) => void };

export function SuspectSelectCard({ suspect, state, isSelected = false, disabled = false, onSelect }: SuspectSelectCardProps) {
  return <button type="button" disabled={disabled} onClick={() => onSelect(suspect.id)} className={`group relative overflow-hidden border bg-noir-900/60 transition-colors disabled:opacity-40 ${isSelected ? 'border-evidence-red shadow-[0_0_0_1px_rgba(179,57,47,0.6),0_0_24px_rgba(179,57,47,0.35)]' : 'border-brass-600/30 hover:border-brass-500/60'}`}>
    <div className="grid aspect-[16/10] w-full place-items-center bg-[radial-gradient(circle_at_40%_28%,#3a322a_0%,#1a1510_55%,#0a0806_100%)] font-display text-5xl text-parchment-300/40" aria-hidden>{suspect.name.slice(0, 1)}</div>
    <div className="p-4"><div className="border border-brass-600/30 bg-noir-800/60 px-4 py-2 text-center font-display text-lg text-parchment-200">{suspect.name}</div><p className="mt-2 text-xs text-parchment-300/60">{suspect.occupation ?? '직업 미상'} · {state?.emotion ?? suspect.initialEmotion}</p></div>
  </button>;
}
