import type { PublicSuspect } from '@/types/content';
import type { SessionView } from '@/types/session';

type SuspectStatusCardProps = { suspect: PublicSuspect; state?: SessionView['suspectStates'][number]; disabled?: boolean; onSelect: (suspectId: string) => void };

export function SuspectStatusCard({ suspect, state, disabled = false, onSelect }: SuspectStatusCardProps) {
  return <button type="button" disabled={disabled} onClick={() => onSelect(suspect.id)} className="group relative block w-full overflow-hidden border border-brass-600/30 bg-noir-900/60 text-left transition-colors hover:border-brass-500/60 disabled:cursor-not-allowed disabled:opacity-40">
    <div className="grid aspect-[16/10] w-full place-items-center bg-[radial-gradient(circle_at_40%_28%,#3a322a_0%,#1a1510_55%,#0a0806_100%)] font-display text-5xl text-parchment-300/40" aria-hidden>{suspect.name.slice(0, 1)}</div>
    <div className="p-4"><div className="border border-brass-600/30 bg-noir-800/60 px-4 py-2 text-center font-display text-lg text-parchment-200">{suspect.name}</div><p className="mt-2 text-center text-xs text-parchment-300/60">{suspect.age ? `${suspect.age}세` : '나이 미상'} · {suspect.occupation ?? '직업 미상'}</p><p className="mt-2 text-center text-xs font-bold text-brass-400">감정 {state?.emotion ?? suspect.initialEmotion} · 질문 {state?.questionsAsked ?? 0}회</p></div>
  </button>;
}
