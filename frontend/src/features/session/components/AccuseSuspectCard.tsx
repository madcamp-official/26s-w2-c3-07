import type { PublicSuspect } from '@/types/content';

type AccuseSuspectCardProps = { suspect: PublicSuspect; isSelected: boolean; disabled?: boolean; onSelect: (id: string) => void };

export function AccuseSuspectCard({ suspect, isSelected, disabled = false, onSelect }: AccuseSuspectCardProps) {
  return <button type="button" disabled={disabled} onClick={() => onSelect(suspect.id)} className={`relative overflow-hidden border bg-noir-900/60 text-left transition-colors disabled:opacity-40 ${isSelected ? 'border-evidence-red shadow-[0_0_0_1px_rgba(179,57,47,0.6),0_0_24px_rgba(179,57,47,0.35)]' : 'border-brass-600/30 hover:border-brass-500/60'}`}>
    <div className="grid aspect-[16/10] w-full place-items-center bg-[radial-gradient(circle_at_40%_28%,#3a322a_0%,#1a1510_55%,#0a0806_100%)] font-display text-5xl text-parchment-300/40" aria-hidden>{suspect.name.slice(0, 1)}</div>
    <div className="p-4"><p className="font-display text-lg text-parchment-100">{suspect.name}</p><p className="mt-1 text-xs text-parchment-300/60">{suspect.age ? `${suspect.age}세` : '나이 미상'} · {suspect.occupation ?? '직업 미상'}</p><p className="mt-2 text-xs leading-relaxed text-parchment-300/50">피해자와의 관계: {suspect.victimRelation ?? '미상'}</p></div>
  </button>;
}
