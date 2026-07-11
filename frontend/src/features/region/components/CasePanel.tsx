import Link from "next/link";
import { DifficultyStars } from "@/features/region/components/DifficultyStars";
import type { Region } from "@/features/region/types";

type CasePanelProps = {
  region: Region;
};

export function CasePanel({ region }: CasePanelProps) {
  const { case: caseInfo } = region;

  return (
    <div className="relative border border-brass-600/40 bg-[#e9dfc7] text-noir-900 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between border-b border-noir-900/15 px-6 py-4">
        <span className="border-2 border-evidence-red px-3 py-1 font-display text-lg font-bold text-evidence-red">
          {region.name}
        </span>
        <p className="text-sm text-noir-900/60">발생 순 ▾</p>
      </div>

      <div className="flex flex-col gap-6 p-6 md:flex-row">
        <div className="h-48 w-full shrink-0 bg-[radial-gradient(circle_at_35%_30%,#4a3f30_0%,#241e17_60%,#100d09_100%)] md:h-auto md:w-64" />

        <div className="flex flex-1 flex-col justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-widest text-evidence-red">CASE 01</p>
            <h3 className="mt-1 font-display text-2xl font-bold text-noir-900">{caseInfo.title}</h3>
            <p className="mt-1 text-sm text-noir-900/60">{caseInfo.subtitle}</p>
            <p className="mt-3 text-sm leading-relaxed text-noir-900/80">{caseInfo.description}</p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">
              <p className="mb-1 text-noir-900/60">난이도</p>
              <DifficultyStars level={caseInfo.difficulty} />
            </div>
            <Link
              href={`/episodes/${caseInfo.id}`}
              className="bg-noir-900 px-6 py-3 font-display text-sm font-bold text-parchment-100 transition-colors hover:bg-noir-800"
            >
              사건 선택
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
