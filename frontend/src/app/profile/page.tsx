"use client";

import { BackButton } from "@/components/ui/BackButton";
import { AlleyBackground } from "@/components/layout/AlleyBackground";
import { BrandMark } from "@/components/layout/BrandMark";
import { ALL_CASES } from "@/features/case/data";
import { ProfileMenuLink } from "@/features/progress/components/ProfileMenuLink";
import { ProfileSummaryCard } from "@/features/progress/components/ProfileSummaryCard";
import { usePlayHistory } from "@/features/session/hooks/usePlayHistory";

export default function ProfilePage() {
  const records = usePlayHistory();
  const clearedCount = records.filter((r) => r.isCleared).length;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_10%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <AlleyBackground />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <BackButton href="/" label="홈으로" />
        </div>

        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-evidence-red">DETECTIVE PROFILE</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-parchment-100 md:text-4xl">내 프로필</h1>
        </div>

        <ProfileSummaryCard nickname="탐정" clearedCount={clearedCount} totalCount={ALL_CASES.length} />

        <div className="flex flex-col gap-4">
          <ProfileMenuLink
            href="/profile/progress"
            icon="🗺️"
            title="지역별 진행도"
            description="지역별 사건 해결 현황을 확인하세요."
          />
          <ProfileMenuLink
            href="/profile/history"
            icon="📖"
            title="플레이 기록"
            description="지금까지 수사한 사건들의 기록을 확인하세요."
          />
        </div>

        <button
          type="button"
          className="mt-4 border border-brass-600/40 bg-noir-900/60 py-3 text-sm text-parchment-300/70 transition-colors hover:border-brass-400 hover:text-parchment-100"
        >
          ⏻ 로그아웃
        </button>
      </div>
    </main>
  );
}
