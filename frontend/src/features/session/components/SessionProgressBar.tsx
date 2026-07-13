type SessionProgressBarProps = {
  totalQuestionsLeft: number;
  totalQuestions: number;
  cluesFound: number;
  cluesTotal: number;
};

export function SessionProgressBar({
  totalQuestionsLeft,
  totalQuestions,
  cluesFound,
  cluesTotal,
}: SessionProgressBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6 border border-brass-600/30 bg-noir-900/60 px-6 py-3 text-sm text-parchment-200">
      <span>
        남은 질문 <span className="font-bold text-evidence-red">{totalQuestionsLeft}</span> / {totalQuestions}
      </span>
      <span className="h-4 w-px bg-brass-600/30" />
      <span>
        확보한 단서 <span className="font-bold text-brass-400">{cluesFound}</span> / {cluesTotal}
      </span>
    </div>
  );
}
