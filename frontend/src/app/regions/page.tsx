"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { CaseArchiveCard } from "@/features/region/components/CaseArchiveCard";
import { CasePanel } from "@/features/region/components/CasePanel";
import { DifficultySelector } from "@/features/region/components/DifficultySelector";
import { RegionMap } from "@/features/region/components/RegionMap";
import { SelectedRegionInfo } from "@/features/region/components/SelectedRegionInfo";
import { TipBar } from "@/features/region/components/TipBar";
import { REGIONS } from "@/features/region/constants";
import type { DifficultyId, RegionId } from "@/features/region/types";
import { AlleyBackground } from "@/components/layout/AlleyBackground";
import { BrandMark } from "@/components/layout/BrandMark";

export default function RegionsPage() {
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>(REGIONS[0].id);
  const [selectedDifficultyId, setSelectedDifficultyId] = useState<DifficultyId>("normal");
  const selectedRegion = REGIONS.find((region) => region.id === selectedRegionId) ?? null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-noir-950">
      <AlleyBackground />

      <div className="relative flex flex-col gap-8 px-6 py-8 md:px-12 md:py-10">
        {/* 상단 헤더 */}
        <div className="flex items-start justify-between gap-6">
          <BrandMark />

          <div className="flex flex-1 flex-col items-center text-center">
            <h1 className="font-display text-3xl font-bold text-parchment-100 md:text-4xl">지역 및 사건 선택</h1>
            <p className="mt-2 text-sm text-parchment-300/70">조사할 지역을 선택하고 사건을 확인하세요.</p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-3">
            <BackButton />
            <CaseArchiveCard solvedCount={0} totalCount={REGIONS.length} cluesCollected={2} cluesTotal={18} />
          </div>
        </div>

        {/* 본문: 지도 + 사건 패널 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_1fr]">
          <div className="flex flex-col gap-4">
            <RegionMap selectedRegionId={selectedRegionId} onSelectRegion={setSelectedRegionId} />
            <SelectedRegionInfo region={selectedRegion} />
          </div>

          {selectedRegion && (
            <CasePanel region={selectedRegion} selectedDifficultyId={selectedDifficultyId} />
          )}
        </div>

        {/* 하단 TIP + 난이도 선택 */}
        <div className="flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between">
          <TipBar />
          <DifficultySelector
            selectedDifficultyId={selectedDifficultyId}
            onSelectDifficulty={setSelectedDifficultyId}
          />
        </div>
      </div>
    </main>
  );
}
