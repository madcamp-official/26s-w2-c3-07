"use client";

import { notFound, useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getCaseById } from "@/features/case/data";
import { getResponse } from "@/features/case/services/responseEngine";
import type { Difficulty, Message } from "@/features/case/types";
import { QUESTIONS_PER_SUSPECT } from "@/features/case/types";
import { ConversationLog } from "@/features/interrogation/components/ConversationLog";
import { InterrogationTitle } from "@/features/interrogation/components/InterrogationTitle";
import { QuestionInputBar } from "@/features/interrogation/components/QuestionInputBar";
import { QuestionsLeftBadge } from "@/features/interrogation/components/QuestionsLeftBadge";
import { SuspectPortrait } from "@/features/interrogation/components/SuspectPortrait";

export default function InterrogationPage() {
  const params = useParams<{ sessionId: string; suspectId: string }>();
  const searchParams = useSearchParams();
  const difficulty = (searchParams.get("difficulty") as Difficulty | null) ?? "normal";

  const caseData = getCaseById(params.sessionId);
  const suspect = caseData?.suspects.find((s) => s.id === params.suspectId);

  const [messages, setMessages] = useState<Message[]>([]);
  const [msgIdCounter, setMsgIdCounter] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);

  if (!caseData || !suspect) {
    notFound();
  }

  const questionsPerSuspect = QUESTIONS_PER_SUSPECT[difficulty];
  const questionsUsed = messages.filter((m) => m.role === "detective").length;
  const questionsLeft = questionsPerSuspect - questionsUsed;
  const exhausted = questionsLeft <= 0;

  const handleAskQuestion = (question: string) => {
    if (exhausted || isWaiting) return;
    setIsWaiting(true);

    const { text, emotion, clueIds } = getResponse(suspect, question, difficulty);

    const detectiveMsg: Message = { id: msgIdCounter, role: "detective", text: question, emotion: "calm", clueIds: [] };
    const suspectMsg: Message = { id: msgIdCounter + 1, role: "suspect", text, emotion, clueIds };

    window.setTimeout(() => {
      setMessages((prev) => [...prev, detectiveMsg, suspectMsg]);
      setMsgIdCounter((id) => id + 2);
      setIsWaiting(false);
    }, 500);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_15%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <InterrogationTitle />

        <SuspectPortrait />

        <div className="mx-auto text-center">
          <p className="font-display text-xl text-parchment-100">{suspect.name}</p>
          <p className="mt-1 text-sm text-parchment-300/60">
            {suspect.age}세 · {suspect.job}
          </p>
        </div>

        <QuestionsLeftBadge left={Math.max(questionsLeft, 0)} total={questionsPerSuspect} />

        <ConversationLog messages={messages} />

        {exhausted ? (
          <div className="border border-evidence-red/60 bg-evidence-red/10 px-6 py-4 text-center text-sm text-parchment-100">
            이 용의자에 대한 질문 횟수를 모두 소진했습니다.
          </div>
        ) : (
          <>
            <QuestionInputBar onSubmit={handleAskQuestion} disabled={isWaiting} />
            <p className="text-center text-xs text-parchment-300/40">⚠ 무의미한 질문도 횟수가 차감됩니다.</p>
          </>
        )}
      </div>
    </main>
  );
}
