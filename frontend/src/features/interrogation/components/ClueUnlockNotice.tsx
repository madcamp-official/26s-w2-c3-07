import type { InterrogationResponse } from '@/types/interrogation';

type UnlockedClue = InterrogationResponse['newlyUnlockedClues'][number];

export function ClueUnlockNotice({ clues, onDismiss }: { clues: UnlockedClue[]; onDismiss: () => void }) {
  const unique = [...new Map(clues.map((clue) => [clue.id, clue])).values()];
  if (unique.length === 0) return null;

  return (
    <aside role="status" aria-live="polite" className="border border-brass-400 bg-noir-900 p-4 shadow-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.2em] text-evidence-red">새로운 단서 획득</p>
          <div className="mt-3 space-y-3">
            {unique.map((clue) => (
              <article key={clue.id}>
                <h2 className="font-display text-lg text-parchment-100">{clue.title}</h2>
                <p className="mt-1 text-sm text-parchment-300/75">{clue.recordSummary || clue.content}</p>
              </article>
            ))}
          </div>
        </div>
        <button type="button" onClick={onDismiss} aria-label="단서 알림 닫기" className="text-parchment-300/60 hover:text-parchment-100">×</button>
      </div>
    </aside>
  );
}
