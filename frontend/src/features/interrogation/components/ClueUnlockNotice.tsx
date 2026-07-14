import type { InterrogationResponse } from '@/types/interrogation';

type UnlockedClue = InterrogationResponse['newlyUnlockedClues'][number];
type UnlockedEvidence = InterrogationResponse['newlyUnlockedEvidence'][number];

export function ClueUnlockNotice({ clues, evidence, onDismiss }: { clues: UnlockedClue[]; evidence: UnlockedEvidence[]; onDismiss: () => void }) {
  const uniqueClues = [...new Map(clues.map((clue) => [clue.id, clue])).values()];
  const uniqueEvidence = [...new Map(evidence.map((item) => [item.id, item])).values()];
  if (uniqueClues.length === 0 && uniqueEvidence.length === 0) return null;

  return (
    <aside role="status" aria-live="polite" className="border border-brass-400 bg-noir-900 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          {uniqueClues.length > 0 && <section>
            <p className="text-xs font-bold tracking-[0.2em] text-evidence-red">새로운 단서 획득</p>
            <div className="mt-3 space-y-3">{uniqueClues.map((clue) => <article key={clue.id}>
              <h2 className="font-display text-lg text-parchment-100">{clue.title}</h2>
              <p className="mt-1 text-sm text-parchment-300/75">{clue.recordSummary || clue.content}</p>
            </article>)}</div>
          </section>}
          {uniqueEvidence.length > 0 && <section className={uniqueClues.length ? 'mt-5 border-t border-brass-600/30 pt-4' : ''}>
            <p className="text-xs font-bold tracking-[0.2em] text-brass-400">새로운 증거 획득</p>
            <div className="mt-3 space-y-3">{uniqueEvidence.map((item) => <article key={item.id}>
              <h2 className="font-display text-lg text-parchment-100">{item.title}</h2>
              <p className="mt-1 text-sm text-parchment-300/75">{item.description}</p>
            </article>)}</div>
            <p className="mt-3 text-xs text-parchment-300/60">사건 기록에서 새 증거를 확인할 수 있습니다.</p>
          </section>}
        </div>
        <button type="button" onClick={onDismiss} aria-label="획득 알림 닫기" className="text-parchment-300/60 hover:text-parchment-100">×</button>
      </div>
    </aside>
  );
}
