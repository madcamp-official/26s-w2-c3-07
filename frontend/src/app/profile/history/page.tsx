"use client";

import { BackButton } from "@/components/ui/BackButton";
import { AlleyBackground } from "@/components/layout/AlleyBackground";
import { HistoryRecordCard } from "@/features/progress/components/HistoryRecordCard";
import { usePlayHistory } from "@/features/session/hooks/usePlayHistory";

export default function ProfileHistoryPage() {
  const records = usePlayHistory();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_10%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <AlleyBackground />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-12">
        <BackButton href="/profile" label="프로필로" />

        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-evidence-red">PLAY HISTORY</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-parchment-100 md:text-4xl">플레이 기록</h1>
          <p className="mt-2 text-sm text-parchment-300/60">지금까지 수사한 사건들을 확인하세요.</p>
        </div>

        {records.length === 0 ? (
          <div className="border border-brass-600/30 bg-noir-900/50 px-6 py-12 text-center text-sm text-parchment-300/50">
            아직 수사한 사건이 없습니다. 지역을 선택해 첫 사건을 시작해보세요.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {records.map((record) => (
              <HistoryRecordCard key={record.session.sessionId} record={record} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
