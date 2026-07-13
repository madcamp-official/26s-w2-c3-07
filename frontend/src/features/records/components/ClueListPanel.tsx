import type { Clue } from "@/features/case/types";

type ClueListPanelProps = {
  clues: Clue[];
  foundClueIds: string[];
};

export function ClueListPanel({ clues, foundClueIds }: ClueListPanelProps) {
  const foundSet = new Set(foundClueIds);
  const foundCount = clues.filter((c) => foundSet.has(c.id)).length;

  return (
    <div className="border border-brass-600/40 bg-noir-800/80 p-4">
      <p className="mb-4 font-display text-lg text-parchment-100">
        단서 목록 ({foundCount} / {clues.length})
      </p>

      <div className="grid grid-cols-2 gap-4">
        {clues.map((clue) => {
          const isFound = foundSet.has(clue.id);
          return (
            <figure
              key={clue.id}
              className={`-rotate-1 p-2 pb-3 shadow-[0_8px_20px_rgba(0,0,0,0.5)] ${
                isFound ? "bg-parchment-100" : "bg-noir-900/40"
              }`}
            >
              <div
                className={`aspect-square w-full ${
                  isFound
                    ? "bg-[radial-gradient(circle_at_35%_30%,#4a3f30_0%,#241e17_60%,#100d09_100%)]"
                    : "flex items-center justify-center border border-dashed border-brass-600/30 text-2xl text-parchment-300/30"
                }`}
              >
                {!isFound && "?"}
              </div>
              <figcaption
                className={`mt-2 text-center text-xs font-medium ${isFound ? "text-noir-900" : "text-parchment-300/40"}`}
              >
                {isFound ? clue.title : "미발견 단서"}
              </figcaption>
              <p className="mt-1 text-center">
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-bold ${
                    isFound
                      ? clue.isKey
                        ? "bg-evidence-red/15 text-evidence-red"
                        : "bg-brass-600/15 text-brass-400"
                      : "bg-noir-900/30 text-parchment-300/40"
                  }`}
                >
                  {isFound ? (clue.isKey ? "핵심 단서" : "보조 단서") : "미발견"}
                </span>
              </p>
            </figure>
          );
        })}
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
