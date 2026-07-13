import type { Suspect } from "@/features/case/types";

export function SuspectPreviewStrip({ suspects }: { suspects: Suspect[] }) {
  return (
    <div>
      <p className="mb-3 font-display text-lg text-parchment-100">용의자 ({suspects.length})</p>
      <div className="flex flex-wrap gap-3">
        {suspects.map((suspect) => (
          <div key={suspect.id} className="border border-brass-600/30 bg-noir-900/60 px-4 py-2 text-sm text-parchment-200">
            {suspect.name} · {suspect.age}세 · {suspect.job}
          </div>
        ))}
      </div>
    </div>
  );
}
