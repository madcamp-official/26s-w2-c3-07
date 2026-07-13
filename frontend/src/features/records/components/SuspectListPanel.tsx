import type { InvestigationRecord } from '@/types/record';

type SuspectListPanelProps = { testimonies: InvestigationRecord['testimonies']; selectedSuspectId: string; onSelectSuspect: (id: string) => void };

export function SuspectListPanel({ testimonies, selectedSuspectId, onSelectSuspect }: SuspectListPanelProps) {
  const suspects = Array.from(new Map(testimonies.map((item) => [item.suspectId, item.suspectName])).entries());
  return <section className="border border-brass-600/40 bg-noir-800/80 p-4"><h2 className="mb-4 font-display text-lg text-parchment-100">심문한 용의자</h2>{suspects.length === 0 ? <p className="text-sm text-parchment-300/50">아직 심문 기록이 없습니다.</p> : <ul className="space-y-3">{suspects.map(([id, name]) => <li key={id}><button type="button" onClick={() => onSelectSuspect(id)} className={`flex w-full items-center gap-3 border bg-[#ded2b4] px-3 py-2.5 text-left ${selectedSuspectId === id ? 'border-evidence-red' : 'border-transparent hover:border-brass-500/60'}`}><span className="grid h-12 w-12 place-items-center bg-noir-900 font-display text-parchment-300/50" aria-hidden>{name.slice(0, 1)}</span><span className="font-display text-sm font-bold text-noir-900">{name}</span></button></li>)}</ul>}</section>;
}
