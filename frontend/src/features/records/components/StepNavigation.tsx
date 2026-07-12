type StepNavigationProps = {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
};

export function StepNavigation({ onPrev, onNext, canGoPrev, canGoNext }: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        className="flex items-center gap-2 border border-brass-600/50 bg-noir-800/80 px-5 py-3 text-sm text-parchment-100 transition-colors hover:border-brass-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden>←</span>
        이전 단계
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className="flex items-center gap-2 bg-evidence-red px-6 py-3 font-display text-sm font-bold text-parchment-100 transition-colors hover:bg-[#c94539] disabled:cursor-not-allowed disabled:opacity-40"
      >
        다음 단계
        <span aria-hidden>→</span>
      </button>
    </div>
  );
}
