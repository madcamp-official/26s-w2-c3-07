type SessionProgressBarProps = { totalQuestionsLeft: number; totalQuestions?: number; cluesFound: number; remainingSeconds: number };

export function SessionProgressBar({ totalQuestionsLeft, totalQuestions, cluesFound, remainingSeconds }: SessionProgressBarProps) {
  return <div className="flex flex-wrap items-center justify-center gap-6 border border-brass-600/30 bg-noir-900/60 px-6 py-3 text-sm text-parchment-200"><span>남은 질문 <b className="text-evidence-red">{totalQuestionsLeft}</b>{totalQuestions ? ` / ${totalQuestions}` : ''}</span><span className="h-4 w-px bg-brass-600/30"/><span>획득 단서 <b className="text-brass-400">{cluesFound}</b></span><span className="h-4 w-px bg-brass-600/30"/><span>남은 시간 <b className="text-brass-400">{remainingSeconds}초</b></span></div>;
}
