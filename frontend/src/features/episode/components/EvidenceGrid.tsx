import type { Evidence } from "@/features/case/types";

export function EvidenceGrid({ evidence }: { evidence: Evidence[] }) {
  return (
    <div>
      <p className="mb-3 font-display text-lg text-parchment-100">현장 증거 ({evidence.length})</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {evidence.map((item, i) => (
          <div key={item.id} className="flex gap-3 border border-brass-600/30 bg-noir-900/60 p-4">
            <span className="shrink-0 font-display text-lg font-bold text-evidence-red">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="font-display text-sm font-bold text-parchment-100">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-parchment-300/60">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
