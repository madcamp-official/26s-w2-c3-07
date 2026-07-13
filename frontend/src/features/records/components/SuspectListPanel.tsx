import Image from "next/image";
import type { Suspect } from "@/features/case/types";

type SuspectListPanelProps = {
  suspects: Suspect[];
  selectedSuspectId: string;
  onSelectSuspect: (id: string) => void;
};

export function SuspectListPanel({ suspects, selectedSuspectId, onSelectSuspect }: SuspectListPanelProps) {
  return (
    <div className="border border-brass-600/40 bg-noir-800/80 p-4">
      <p className="mb-4 font-display text-lg text-parchment-100">용의자 목록</p>

      <ul className="space-y-3">
        {suspects.map((suspect) => {
          const isSelected = suspect.id === selectedSuspectId;
          return (
            <li key={suspect.id}>
              <button
                type="button"
                onClick={() => onSelectSuspect(suspect.id)}
                className={`flex w-full items-center gap-3 border bg-[#ded2b4] px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "border-evidence-red" : "border-transparent hover:border-brass-500/60"
                }`}
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden bg-[radial-gradient(circle_at_35%_30%,#5a4f40_0%,#2a2318_60%,#100d09_100%)]">
                  <Image
                    src={`/images/suspects/${suspect.id}.png`}
                    alt={suspect.name}
                    fill
                    sizes="48px"
                    className="object-cover object-top"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm font-bold text-noir-900">
                    {suspect.name} ({suspect.age}세)
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-noir-900/60">
                    {isSelected ? "● " : ""}
                    {suspect.job}
                  </span>
                </span>
                {isSelected && (
                  <span aria-hidden className="shrink-0 text-evidence-red">
                    →
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
