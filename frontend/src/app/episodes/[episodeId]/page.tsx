"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { getCaseById } from "@/features/case/data";
import { CaseBriefingHeader } from "@/features/episode/components/CaseBriefingHeader";
import { EvidenceGrid } from "@/features/episode/components/EvidenceGrid";
import { SuspectPreviewStrip } from "@/features/episode/components/SuspectPreviewStrip";
import { VictimSummaryCard } from "@/features/episode/components/VictimSummaryCard";
import { BackButton } from "@/components/ui/BackButton";

export default function EpisodeBriefingPage() {
  const params = useParams<{ episodeId: string }>();
  const searchParams = useSearchParams();
  const difficulty = searchParams.get("difficulty") ?? "normal";

  const caseData = getCaseById(params.episodeId);
  if (!caseData) {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_10%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <BackButton href="/regions" label="뒤로가기" />
        </div>

        <CaseBriefingHeader caseData={caseData} />
        <VictimSummaryCard caseData={caseData} />
        <EvidenceGrid evidence={caseData.evidence} />
        <SuspectPreviewStrip suspects={caseData.suspects} />

        <Link
          href={`/episodes/${caseData.id}/suspects?difficulty=${difficulty}`}
          className="mt-4 flex items-center justify-center gap-2 bg-evidence-red py-4 font-display text-lg font-bold text-parchment-100 transition-colors hover:bg-[#c94539]"
        >
          사건 조사 시작 →
        </Link>
      </div>
    </main>
  );
}
