"use client";

import { BackButton } from "@/components/ui/BackButton";
import { AlleyBackground } from "@/components/layout/AlleyBackground";
import { ALL_CASES } from "@/features/case/data";
import { RegionProgressCard } from "@/features/progress/components/RegionProgressCard";
import { usePlayHistory } from "@/features/session/hooks/usePlayHistory";

export default function ProfileProgressPage() {
  const records = usePlayHistory();
  const recordByCase = new Map(records.map((r) => [r.caseData.id, r]));
  const solvedCount = records.filter((r) => r.isCorrect).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_10%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <AlleyBackground />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
        <BackButton href="/profile" label="프로필로" />

        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-evidence-red">REGION PROGRESS</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-parchment-100 md:text-4xl">지역별 진행도</h1>
          <p className="mt-2 text-sm text-parchment-300/60">
            해결한 사건 {solvedCount} / {ALL_CASES.length}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {ALL_CASES.map((caseData) => {
            const record = recordByCase.get(caseData.id);
            const status = !record
              ? "not-started"
              : !record.isCleared
                ? "in-progress"
                : record.isCorrect
                  ? "solved"
                  : "failed";
            return <RegionProgressCard key={caseData.id} caseData={caseData} status={status} />;
          })}
        </div>
      </div>
    </main>
  );
}
