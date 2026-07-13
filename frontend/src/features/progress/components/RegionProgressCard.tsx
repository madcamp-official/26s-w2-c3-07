import Link from "next/link";
import type { CaseData } from "@/features/case/types";

type RegionProgressCardProps = {
  caseData: CaseData;
  status: "not-started" | "in-progress" | "solved" | "failed";
};

const STATUS_LABEL: Record<RegionProgressCardProps["status"], string> = {
  "not-started": "미도전",
  "in-progress": "수사 중",
  solved: "사건 해결",
  failed: "오답",
};

const STATUS_STYLE: Record<RegionProgressCardProps["status"], string> = {
  "not-started": "border-brass-600/30 bg-noir-900/50 text-parchment-300/50",
  "in-progress": "border-brass-500 bg-brass-600/10 text-brass-400",
  solved: "border-evidence-red bg-evidence-red/15 text-evidence-red",
  failed: "border-brass-600/40 bg-noir-900/60 text-parchment-300/60",
};

export function RegionProgressCard({ caseData, status }: RegionProgressCardProps) {
  return (
    <Link
      href={`/episodes/${caseData.id}?difficulty=normal`}
      className="flex items-center gap-5 border border-brass-600/40 bg-noir-800/80 p-5 transition-colors hover:border-brass-400"
    >
      <span className="shrink-0 text-3xl" aria-hidden>
        {caseData.regionEmoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg text-parchment-100">{caseData.regionName}</p>
        <p className="mt-1 text-xs text-parchment-300/60">{caseData.title}</p>
      </div>
      <span className={`shrink-0 border px-3 py-1.5 text-xs font-bold ${STATUS_STYLE[status]}`}>
        {STATUS_LABEL[status]}
      </span>
    </Link>
  );
}
