import type { Scene } from '@/types/content';

type EvidenceGridProps = { evidence: Scene['evidence'] };

export function EvidenceGrid({ evidence }: EvidenceGridProps) {
  return <section>
    <h2 className="mb-3 font-display text-lg text-parchment-100">현장 증거 ({evidence.length})</h2>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {evidence.map((item, index) => <article key={item.id} className="flex gap-3 border border-brass-600/30 bg-noir-900/60 p-4">
        <span className="shrink-0 font-display text-lg font-bold text-evidence-red">{String(index + 1).padStart(2, '0')}</span>
        <div><h3 className="font-display text-sm font-bold text-parchment-100">{item.title}</h3><p className="mt-1 text-xs leading-relaxed text-parchment-300/60">{item.description}</p></div>
      </article>)}
    </div>
  </section>;
}
