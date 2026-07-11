export function TipBar() {
  return (
    <div className="flex items-center gap-3 border border-brass-600/40 bg-noir-800/85 px-5 py-3 text-sm text-parchment-300">
      <span aria-hidden className="text-brass-400">
        🔍
      </span>
      <span className="font-bold text-brass-400">TIP</span>
      <span className="text-parchment-300/80">사건을 해결하면 새로운 단서와 심문 기술을 얻을 수 있습니다.</span>
    </div>
  );
}
