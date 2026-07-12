import type { Suspect, TestimonyEntry } from "@/features/records/types";

type TestimonyLogPanelProps = {
  entries: TestimonyEntry[];
  suspects: Suspect[];
  highlightedSuspectId: string;
};

export function TestimonyLogPanel({ entries, suspects, highlightedSuspectId }: TestimonyLogPanelProps) {
  const suspectById = new Map(suspects.map((s) => [s.id, s]));

  return (
    <div className="border border-brass-600/40 bg-[#e9dfc7] p-5">
      <p className="mb-4 font-display text-lg text-noir-900">심문 기록</p>

      <div className="space-y-4">
        {entries.map((entry) => {
          const suspect = suspectById.get(entry.suspectId);
          const isHighlighted = entry.suspectId === highlightedSuspectId;
          return (
            <div
              key={`${entry.suspectId}-${entry.time}`}
              className={`relative flex items-start gap-3 border bg-[#f4ecd8] p-3 ${
                isHighlighted ? "border-evidence-red" : "border-noir-900/10"
              }`}
            >
              {isHighlighted && (
                <span
                  aria-hidden
                  className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-evidence-red shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
                />
              )}
              <span className="h-12 w-12 shrink-0 bg-[radial-gradient(circle_at_35%_30%,#5a4f40_0%,#2a2318_60%,#100d09_100%)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-base font-bold text-noir-900">{suspect?.name}</p>
                  <p className="shrink-0 text-xs text-noir-900/50">{entry.time}</p>
                </div>
                <div className="mt-1 space-y-0.5 text-sm leading-relaxed text-noir-900/80">
                  {entry.lines.map((line, i) => (
                    <p key={i}>{i === 0 ? `"${line}` : line.endsWith("...") || i === entry.lines.length - 1 ? `${line}"` : line}</p>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
