import Link from "next/link";
import type { PlayRecord } from "@/features/session/hooks/usePlayHistory";

export function HistoryRecordCard({ record }: { record: PlayRecord }) {
  const { session, caseData, isCleared, isCorrect, questionsUsed, cluesFound } = record;

  return (
    <div className="flex items-center gap-5 border border-brass-600/40 bg-noir-800/80 p-5">
      <span className="shrink-0 text-3xl" aria-hidden>
        {caseData.regionEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-display text-lg text-parchment-100">{caseData.title}</p>
          <span className="text-xs text-parchment-300/50">{caseData.regionName}</span>
        </div>
        <p className="mt-1 text-xs text-parchment-300/60">
          질문 {questionsUsed}회 · 단서 {cluesFound}/{caseData.clues.length}
        </p>
      </div>

      {isCleared ? (
        <span
          className={`shrink-0 border px-3 py-1.5 text-xs font-bold ${
            isCorrect
              ? "border-evidence-red bg-evidence-red/15 text-evidence-red"
              : "border-brass-600/40 bg-noir-900/60 text-parchment-300/60"
          }`}
        >
          {isCorrect ? "사건 해결" : "오답"}
        </span>
      ) : (
        <Link
          href={`/game/${session.sessionId}?difficulty=${session.difficulty}`}
          className="shrink-0 border border-brass-600/50 bg-noir-900/70 px-4 py-2 text-xs font-bold text-parchment-100 transition-colors hover:border-brass-400"
        >
          이어서 수사
        </Link>
      )}
    </div>
  );
}
