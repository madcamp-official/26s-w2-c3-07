export function InterrogationTitle() {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-4">
        <span aria-hidden className="h-px w-24 bg-brass-600/40 md:w-40" />
        <span aria-hidden className="text-brass-400">
          ◈
        </span>
        <h1 className="font-display text-4xl font-bold text-parchment-100 md:text-5xl">용의자 심문</h1>
        <span aria-hidden className="text-brass-400">
          ◈
        </span>
        <span aria-hidden className="h-px w-24 bg-brass-600/40 md:w-40" />
      </div>
      <p className="mt-3 text-sm text-parchment-300/70">용의자와 1:1로 대면하여 질문하세요.</p>
    </div>
  );
}
