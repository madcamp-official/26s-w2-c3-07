import type { Clue } from "@/features/records/types";

type ClueListPanelProps = {
  clues: Clue[];
  totalSlots: number;
};

export function ClueListPanel({ clues, totalSlots }: ClueListPanelProps) {
  const emptySlots = Math.max(totalSlots - clues.length, 0);

  return (
    <div className="border border-brass-600/40 bg-noir-800/80 p-4">
      <p className="mb-4 font-display text-lg text-parchment-100">
        단서 목록 ({clues.length} / {totalSlots})
      </p>

      <div className="grid grid-cols-2 gap-4">
        {clues.map((clue) => (
          <figure key={clue.id} className="-rotate-1 bg-parchment-100 p-2 pb-3 shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
            <div className="aspect-square w-full bg-[radial-gradient(circle_at_35%_30%,#4a3f30_0%,#241e17_60%,#100d09_100%)]" />
            <figcaption className="mt-2 text-center text-xs font-medium text-noir-900">{clue.label}</figcaption>
            <p className="mt-1 text-center">
              <span
                className={`inline-block px-2 py-0.5 text-[10px] font-bold ${
                  clue.status === "analyzed" ? "bg-evidence-red/15 text-evidence-red" : "bg-noir-900/10 text-noir-900/50"
                }`}
              >
                {clue.status === "analyzed" ? "분석 완료" : "미분석"}
              </span>
            </p>
          </figure>
        ))}

        {Array.from({ length: emptySlots }, (_, i) => (
          <div
            key={`empty-${i}`}
            className="flex aspect-[0.85] flex-col items-center justify-center gap-1 border border-dashed border-brass-600/40 text-parchment-300/40"
          >
            <span className="text-2xl">?</span>
            <span className="text-xs">추가 단서</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 flex w-full items-center justify-center gap-2 border border-brass-600/50 bg-noir-900/70 py-3 text-sm text-parchment-100 transition-colors hover:border-brass-400"
      >
        <span aria-hidden>🔍</span>
        단서 분석하기
      </button>
    </div>
  );
}
