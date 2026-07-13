"use client";

import { notFound, useParams, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { getCaseById } from "@/features/case/data";
import type { Difficulty } from "@/features/case/types";
import { AccuseSuspectCard } from "@/features/session/components/AccuseSuspectCard";
import { useGameSession } from "@/features/session/hooks/useGameSession";

export default function DeductionPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const difficulty = (searchParams.get("difficulty") as Difficulty | null) ?? "normal";

  const caseData = getCaseById(params.sessionId);
  const { setAccusedId } = useGameSession(params.sessionId, params.sessionId, difficulty);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  if (!caseData) {
    notFound();
  }

  const selectedSuspect = caseData.suspects.find((s) => s.id === selectedId) ?? null;

  const handleConfirm = () => {
    if (!selectedId) return;
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setAccusedId(selectedId);
    router.push(`/game/${params.sessionId}/result?difficulty=${difficulty}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_10%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
        <BackButton href={`/game/${params.sessionId}?difficulty=${difficulty}`} label="용의자 목록으로" />

        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-evidence-red">FINAL ACCUSATION</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-parchment-100 md:text-4xl">
            이 사건의 범인은 누구일까요?
          </h1>
          <p className="mt-3 text-sm text-parchment-300/60">
            지금까지 얻은 단서를 바탕으로 진범을 지목하세요.
            <br />
            <span className="text-evidence-red">한 번 지목하면 되돌릴 수 없습니다.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {caseData.suspects.map((suspect) => (
            <AccuseSuspectCard
              key={suspect.id}
              suspect={suspect}
              isSelected={suspect.id === selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                setConfirming(false);
              }}
            />
          ))}
        </div>

        {selectedSuspect && (
          <div className="border border-evidence-red/50 bg-evidence-red/10 px-6 py-4 text-center text-sm text-parchment-100">
            {confirming ? (
              <>
                <span className="font-bold text-evidence-red">{selectedSuspect.name}</span>을(를) 범인으로
                최종 지목하시겠습니까?
                <p className="mt-1 text-xs text-parchment-300/60">이 결정은 되돌릴 수 없습니다.</p>
              </>
            ) : (
              <>
                <span className="font-bold text-evidence-red">{selectedSuspect.name}</span>을(를) 범인으로
                지목합니다.
              </>
            )}
          </div>
        )}

        <button
          type="button"
          disabled={!selectedId}
          onClick={handleConfirm}
          className="bg-evidence-red py-4 font-display text-lg font-bold text-parchment-100 transition-colors hover:bg-[#c94539] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {confirming ? "최종 확인 → 체포 명령" : "이 사람을 범인으로 지목하기 →"}
        </button>
      </div>
    </main>
  );
}
