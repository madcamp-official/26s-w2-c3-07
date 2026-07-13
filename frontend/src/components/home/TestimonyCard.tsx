export function TestimonyCard() {
  return (
    <div className="w-64 space-y-3">
      <div className="rotate-1 border border-brass-600/30 bg-noir-800/85 px-4 py-3 text-sm leading-relaxed text-parchment-300 shadow-[0_10px_24px_rgba(0,0,0,0.6)]">
        <p>&quot;나리이 내 말 듣고 그래 나가 다른 곳으로...&quot;</p>
        <p className="mt-2">그게 나가 어떻게 봤을때 이상한거 아닌가?</p>
      </div>

      <div className="flex items-center gap-2 self-start border border-evidence-red/50 bg-noir-900/80 px-3 py-1.5 text-xs text-parchment-100 shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
        <span className="h-2 w-2 rounded-full bg-evidence-red" />
        증거물 #7
      </div>
    </div>
  );
}
