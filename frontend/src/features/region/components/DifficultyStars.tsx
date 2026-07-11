import type { CaseDifficulty } from "@/features/region/types";

export function DifficultyStars({ level }: { level: CaseDifficulty }) {
  return (
    <div className="flex items-center gap-1 text-lg leading-none">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= level ? "text-evidence-red" : "text-parchment-300/25"}>
          ★
        </span>
      ))}
    </div>
  );
}
