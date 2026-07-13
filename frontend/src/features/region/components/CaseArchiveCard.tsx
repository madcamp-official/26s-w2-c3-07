type CaseArchiveCardProps = { solvedCount: number; totalCount: number; cluesCollected: number; cluesTotal: number };

export function CaseArchiveCard({ solvedCount, totalCount, cluesCollected, cluesTotal }: CaseArchiveCardProps) {
  return <div className="relative -rotate-1 border border-brass-600/40 bg-noir-800/85 px-5 py-3 text-center shadow-[0_10px_24px_rgba(0,0,0,0.55)]"><span aria-hidden className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-evidence-red"/><p className="font-display text-sm text-parchment-100">사건 보관함</p><div className="mt-2 space-y-0.5 text-xs text-parchment-300"><p>해결한 사건: {solvedCount} / {totalCount}</p><p>수집한 단서: {cluesCollected} / {cluesTotal}</p></div></div>;
}
