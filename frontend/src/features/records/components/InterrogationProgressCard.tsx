type InterrogationProgressCardProps = {
  answered: number;
  total: number;
};

export function InterrogationProgressCard({ answered, total }: InterrogationProgressCardProps) {
  return (
    <div className="relative rotate-1 border border-brass-600/40 bg-noir-800/85 px-6 py-3 text-center shadow-[0_10px_24px_rgba(0,0,0,0.55)]">
      <span
        aria-hidden
        className="absolute -top-2 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-evidence-red shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
      />
      <p className="font-display text-sm text-parchment-100">심문 진행률</p>
      <p className="mt-1 text-xs text-parchment-300">
        질문 횟수 {answered} / {total}
      </p>
      <div className="mt-2 flex items-center justify-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${i < answered ? "bg-evidence-red" : "border border-brass-600/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
