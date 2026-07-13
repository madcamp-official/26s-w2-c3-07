export function RecordsHeaderActions() {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <button
        type="button"
        className="flex flex-col items-center gap-1 border border-brass-600/50 bg-noir-800/80 px-4 py-2 text-xs text-parchment-100 transition-colors hover:border-brass-400"
      >
        <span aria-hidden className="text-lg text-brass-400">
          💡
        </span>
        힌트
      </button>
      <button
        type="button"
        className="flex flex-col items-center gap-1 border border-brass-600/50 bg-noir-800/80 px-4 py-2 text-xs text-parchment-100 transition-colors hover:border-brass-400"
      >
        <span aria-hidden className="text-lg text-brass-400">
          ⚙
        </span>
        설정
      </button>
    </div>
  );
}
