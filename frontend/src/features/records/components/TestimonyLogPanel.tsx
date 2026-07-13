import type { InvestigationRecord } from '@/types/record';

type TestimonyLogPanelProps = { testimonies: InvestigationRecord['testimonies']; highlightedSuspectId: string };

export function TestimonyLogPanel({ testimonies, highlightedSuspectId }: TestimonyLogPanelProps) {
  const visible = highlightedSuspectId ? testimonies.filter((item) => item.suspectId === highlightedSuspectId) : testimonies;
  return <section className="border border-brass-600/40 bg-[#e9dfc7] p-5"><h2 className="mb-4 font-display text-lg text-noir-900">심문 기록</h2>{visible.length === 0 ? <p className="text-sm text-noir-900/50">저장된 심문 내용이 없습니다.</p> : <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">{visible.map((item) => <article key={item.id} className="border border-noir-900/10 bg-[#f4ecd8] p-3"><p className="font-display text-base font-bold text-noir-900">{item.suspectName}</p><p className="mt-2 text-xs text-noir-900/60">Q. {item.question}</p><p className="mt-1 text-sm leading-relaxed text-noir-900/80">A. {item.response}</p></article>)}</div>}</section>;
}
