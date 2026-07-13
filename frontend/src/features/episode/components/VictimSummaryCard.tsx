import type { CaseData } from "@/features/case/types";

export function VictimSummaryCard({ caseData }: { caseData: CaseData }) {
  return (
    <div className="border border-brass-600/40 bg-[#e9dfc7] p-6 text-noir-900">
      <p className="text-xs font-bold tracking-widest text-evidence-red">피해자</p>
      <p className="mt-1 font-display text-xl font-bold text-noir-900">
        {caseData.victim.name} ({caseData.victim.age}세, {caseData.victim.job})
      </p>
      <p className="mt-4 text-sm leading-relaxed text-noir-900/80">{caseData.summary}</p>
    </div>
  );
}
