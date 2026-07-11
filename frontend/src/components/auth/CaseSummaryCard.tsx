export function CaseSummaryCard() {
  return (
    <div className="w-64 -rotate-1 border border-brass-600/40 bg-noir-800/80 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-2">
        <p className="font-display text-lg text-parchment-100">사건 개요</p>
        <span className="mt-1 shrink-0 -rotate-6 border-2 border-evidence-red px-2 py-0.5 text-xs font-bold tracking-widest text-evidence-red">
          기밀
        </span>
      </div>

      <div className="space-y-1 border-t border-brass-600/30 pt-3 text-sm text-parchment-300">
        <p>2024.05.17</p>
        <p>경상도 OO시 살인 사건</p>
      </div>

      <p className="mt-4 border-t border-brass-600/30 pt-3 text-xs leading-relaxed text-parchment-300/70">
        용의자 심문을
        <br />
        통해 진실을 밝혀라
      </p>
    </div>
  );
}
