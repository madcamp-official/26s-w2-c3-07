"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { InterrogationTitle } from "@/features/interrogation/components/InterrogationTitle";
import { QuestionInputBar } from "@/features/interrogation/components/QuestionInputBar";
import { SuspectPortrait } from "@/features/interrogation/components/SuspectPortrait";
import { TabbedPanel } from "@/features/interrogation/components/TabbedPanel";
import { SUSPECTS } from "@/features/suspect/constants";

export default function InterrogationPage() {
  const params = useParams<{ suspectId: string }>();
  const suspect = SUSPECTS.find((s) => s.id === params.suspectId) ?? SUSPECTS[0];
  const [currentTestimony, setCurrentTestimony] = useState(suspect.openingTestimony);
  const [isWaiting, setIsWaiting] = useState(false);

  const handleAskQuestion = (question: string) => {
    setIsWaiting(true);
    setCurrentTestimony(`(질문: "${question}") 답변을 준비 중입니다...`);
    // TODO: LLM 응답 연동 전까지 임시로 원래 진술을 유지
    window.setTimeout(() => {
      setCurrentTestimony(suspect.openingTestimony);
      setIsWaiting(false);
    }, 800);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_15%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
        <InterrogationTitle />

        <SuspectPortrait />

        <TabbedPanel label="현재 진술">
          <p className="text-base leading-relaxed text-parchment-100">{currentTestimony}</p>
        </TabbedPanel>

        <QuestionInputBar onSubmit={handleAskQuestion} disabled={isWaiting} />
      </div>
    </main>
  );
}
