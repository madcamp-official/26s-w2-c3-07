"use client";

import { DIFFICULTY_OPTIONS } from "@/features/region/constants";
import type { DifficultyId } from "@/features/region/types";

type DifficultySelectorProps = {
  selectedDifficultyId: DifficultyId;
  onSelectDifficulty: (id: DifficultyId) => void;
};

export function DifficultySelector({ selectedDifficultyId, onSelectDifficulty }: DifficultySelectorProps) {
  return (
    <div className="flex items-center gap-2 border border-evidence-red/50 bg-noir-900/80 px-3 py-2">
      <span aria-hidden className="pl-1 text-brass-400">
        ⚙
      </span>
      {DIFFICULTY_OPTIONS.map((option) => {
        const isSelected = option.id === selectedDifficultyId;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onSelectDifficulty(option.id)}
            className={`px-4 py-2 text-sm font-display transition-colors ${
              isSelected
                ? "bg-evidence-red text-parchment-100"
                : "text-parchment-300/70 hover:text-parchment-100"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
