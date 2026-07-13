"use client";

import { notFound, useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { getCaseById } from "@/features/case/data";
import { SelectSuspectButton } from "@/features/suspect/components/SelectSuspectButton";
import { SuspectProfileBar } from "@/features/suspect/components/SuspectProfileBar";
import { SuspectSelectCard } from "@/features/suspect/components/SuspectSelectCard";

export default function SuspectsPage() {
  const params = useParams<{ episodeId: string }>();
  const searchParams = useSearchParams();
  const difficulty = searchParams.get("difficulty") ?? "normal";
  const caseData = getCaseById(params.episodeId);

  const [selectedSuspectId, setSelectedSuspectId] = useState(caseData?.suspects[0]?.id ?? "");

  if (!caseData) {
    notFound();
  }

  const selectedSuspect = caseData.suspects.find((s) => s.id === selectedSuspectId) ?? caseData.suspects[0];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_20%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <div className="relative flex min-h-screen flex-col gap-10 px-6 py-12 md:px-12">
        {/* 타이틀 */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-4">
            <span aria-hidden className="h-px w-24 bg-brass-600/40 md:w-40" />
            <span aria-hidden className="text-brass-400">
              ◈
            </span>
            <h1 className="font-display text-4xl font-bold text-parchment-100 md:text-5xl">용의자 선택</h1>
            <span aria-hidden className="text-brass-400">
              ◈
            </span>
            <span aria-hidden className="h-px w-24 bg-brass-600/40 md:w-40" />
          </div>
          <p className="mt-3 text-sm text-parchment-300/70">심문할 용의자를 선택하세요.</p>
        </div>

        {/* 용의자 그리드 */}
        <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {caseData.suspects.map((suspect) => (
            <SuspectSelectCard
              key={suspect.id}
              suspect={suspect}
              isSelected={suspect.id === selectedSuspectId}
              onSelect={setSelectedSuspectId}
            />
          ))}
        </div>

        {/* 하단 프로필 바 + 액션 */}
        <div className="mt-auto flex flex-col items-stretch gap-4 md:flex-row md:items-center">
          <BackButton label="뒤로가기" href="/regions" />
          <SuspectProfileBar suspect={selectedSuspect} />
          <SelectSuspectButton
            href={`/game/${caseData.id}/interrogation/${selectedSuspect.id}?difficulty=${difficulty}`}
          />
        </div>
      </div>
    </main>
  );
}
