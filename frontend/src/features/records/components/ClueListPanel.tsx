import type { InvestigationRecord } from '@/types/record';

export function ClueListPanel({ clues }: { clues: InvestigationRecord['clues'] }) {
  return <section className="border border-brass-600/40 bg-noir-800/80 p-4"><h2 className="mb-4 font-display text-lg text-parchment-100">획득 단서 ({clues.length})</h2>{clues.length === 0 ? <p className="text-sm text-parchment-300/50">아직 획득한 단서가 없습니다.</p> : <div className="grid grid-cols-2 gap-4">{clues.map((clue) => <figure key={clue.id} className="-rotate-1 bg-parchment-100 p-2 pb-3 shadow-[0_8px_20px_rgba(0,0,0,0.5)]"><div className="grid aspect-square w-full place-items-center bg-[radial-gradient(circle_at_35%_30%,#4a3f30_0%,#241e17_60%,#100d09_100%)] text-3xl text-parchment-300/50" aria-hidden>?</div><figcaption className="mt-2 text-center text-xs font-medium text-noir-900">{clue.title}</figcaption><p className="mt-1 text-center text-[10px] font-bold text-evidence-red">{clue.clueType}</p></figure>)}</div>}</section>;
}
