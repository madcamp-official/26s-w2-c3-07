import type { CaseData } from "@/features/case/types";

export function CaseBriefingHeader({ caseData }: { caseData: CaseData }) {
  return (
    <div className="border-b border-brass-600/30 pb-6 text-center">
      <p className="text-xs font-bold tracking-widest text-evidence-red">
        {caseData.regionName} · CASE FILE
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-parchment-100 md:text-4xl">{caseData.title}</h1>
      <p className="mt-2 text-sm text-parchment-300/60">
        {caseData.location} · {caseData.date}
      </p>
    </div>
  );
}
