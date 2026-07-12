"use client";

import { useState } from "react";
import { AlleyBackground } from "@/components/layout/AlleyBackground";
import { BrandMark } from "@/components/layout/BrandMark";
import { ClueListPanel } from "@/features/records/components/ClueListPanel";
import { InterrogationProgressCard } from "@/features/records/components/InterrogationProgressCard";
import { RecordsHeaderActions } from "@/features/records/components/RecordsHeaderActions";
import { StepNavigation } from "@/features/records/components/StepNavigation";
import { StepTabs } from "@/features/records/components/StepTabs";
import { SuspectListPanel } from "@/features/records/components/SuspectListPanel";
import { TestimonyLogPanel } from "@/features/records/components/TestimonyLogPanel";
import {
  CLUES,
  RECORD_STEPS,
  SUSPECTS,
  TESTIMONIES,
  TOTAL_CLUE_SLOTS,
  TOTAL_QUESTIONS,
} from "@/features/records/constants";

export default function RecordsPage() {
  const [selectedSuspectId, setSelectedSuspectId] = useState(SUSPECTS[2].id);
  const [activeStepId, setActiveStepId] = useState(1);

  return (
    <main className="relative min-h-screen overflow-hidden bg-noir-950">
      <AlleyBackground />

      <div className="relative flex flex-col gap-6 px-6 py-8 md:px-12 md:py-10">
        {/* 상단 헤더 */}
        <div className="flex items-start justify-between gap-6">
          <BrandMark />

          <div className="flex flex-1 flex-col items-center text-center">
            <h1 className="font-display text-3xl font-bold text-parchment-100 md:text-4xl">사건 기록 열람</h1>
            <p className="mt-2 text-sm text-parchment-300/70">지금까지의 진술과 단서를 확인하세요.</p>
          </div>

          <div className="flex shrink-0 items-start gap-3">
            <InterrogationProgressCard answered={6} total={TOTAL_QUESTIONS} />
            <RecordsHeaderActions />
          </div>
        </div>

        {/* 단계 탭 */}
        <StepTabs steps={RECORD_STEPS} activeStepId={activeStepId} onSelectStep={setActiveStepId} />

        {/* 본문 3단 레이아웃 */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_320px]">
          <SuspectListPanel
            suspects={SUSPECTS}
            selectedSuspectId={selectedSuspectId}
            onSelectSuspect={setSelectedSuspectId}
          />
          <TestimonyLogPanel entries={TESTIMONIES} suspects={SUSPECTS} highlightedSuspectId={selectedSuspectId} />
          <ClueListPanel clues={CLUES} totalSlots={TOTAL_CLUE_SLOTS} />
        </div>

        {/* 하단 네비게이션 */}
        <StepNavigation
          canGoPrev={activeStepId > 1}
          canGoNext={activeStepId < RECORD_STEPS.length}
          onPrev={() => setActiveStepId((id) => Math.max(1, id - 1))}
          onNext={() => setActiveStepId((id) => Math.min(RECORD_STEPS.length, id + 1))}
        />
      </div>
    </main>
  );
}
