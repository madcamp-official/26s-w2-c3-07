import Link from "next/link";
import { DIFFICULTY_OPTIONS } from "@/features/region/constants";
import type { DifficultyId } from "@/features/region/types";
import type { CaseData } from "@/features/case/types";

type CasePanelProps = {
  caseData: CaseData;
  selectedDifficultyId: DifficultyId;
};

export function CasePanel({ caseData, selectedDifficultyId }: CasePanelProps) {
  const difficulty = DIFFICULTY_OPTIONS.find((option) => option.id === selectedDifficultyId)!;

  return (
    <div className="relative border border-brass-600/40 bg-[#e9dfc7] text-noir-900 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between border-b border-noir-900/15 px-6 py-4">
        <span className="border-2 border-evidence-red px-3 py-1 font-display text-lg font-bold text-evidence-red">
          {caseData.regionName}
        </span>
      </div>

      <div className="flex flex-col gap-6 p-6 md:flex-row">
        <div className="h-48 w-full shrink-0 bg-[radial-gradient(circle_at_35%_30%,#4a3f30_0%,#241e17_60%,#100d09_100%)] md:h-auto md:w-64" />

        <div className="flex flex-1 flex-col justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-evidence-red">CASE 01</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-noir-900">{caseData.title}</h3>
            <p className="mt-1 text-sm text-noir-900/60">
              {caseData.location} · {caseData.victim.name} ({caseData.victim.age}세, {caseData.victim.job}) 사망 사건
            </p>
            <p className="mt-3 text-sm leading-relaxed text-noir-900/80">{caseData.summary}</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-noir-900/70">
              <p className="mb-1 font-bold text-noir-900">난이도: {difficulty.label}</p>
              <p>
                용의자당 질문 {difficulty.questionsPerSuspect}회 · {difficulty.description}
              </p>
            </div>
            <Link
              href={`/episodes/${caseData.id}?difficulty=${difficulty.id}`}
              className="shrink-0 bg-noir-900 px-6 py-3 font-display text-sm font-bold text-parchment-100 transition-colors hover:bg-noir-800"
            >
              사건 선택
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
