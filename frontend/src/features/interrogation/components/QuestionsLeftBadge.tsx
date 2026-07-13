export function QuestionsLeftBadge({ left, total }: { left: number; total: number }) {
  const exhausted = left <= 0;
  return <div className={`mx-auto flex items-center gap-2 border px-4 py-1.5 text-xs font-bold ${exhausted ? 'border-evidence-red bg-evidence-red text-parchment-100' : 'border-brass-600/50 text-brass-400'}`}>남은 질문 {left} / {total}</div>;
}
