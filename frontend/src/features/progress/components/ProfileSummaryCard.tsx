type ProfileSummaryCardProps = { nickname: string; clearedCount: number; totalCount: number };

export function ProfileSummaryCard({ nickname, clearedCount, totalCount }: ProfileSummaryCardProps) {
  return <div className="flex items-center gap-6 border border-brass-600/50 bg-noir-800/90 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)]"><span aria-hidden className="flex h-20 w-20 shrink-0 items-center justify-center border border-brass-600/40 bg-noir-900/70 font-display text-3xl text-brass-400">DET</span><div><p className="font-display text-2xl font-bold text-parchment-100">{nickname} 수사관</p><p className="mt-1 text-sm text-brass-400">해결한 사건 {clearedCount} / {totalCount}</p></div></div>;
}
