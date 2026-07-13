"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import { getCaseById } from "@/features/case/data";
import { getResponse } from "@/features/case/services/responseEngine";
import type { Difficulty, Message } from "@/features/case/types";
import { QUESTIONS_PER_SUSPECT } from "@/features/case/types";
import { useGameSession } from "@/features/session/hooks/useGameSession";
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
  const { session, addExchange } = useGameSession(params.sessionId, params.sessionId, difficulty);

  const [msgIdCounter, setMsgIdCounter] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);

  if (!caseData || !suspect) {
    notFound();
  }

  const messages: Message[] =
    session?.conversations.find((c) => c.suspectId === suspect.id)?.messages ?? [];

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
      addExchange(suspect.id, detectiveMsg, suspectMsg);
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
          <div className="flex flex-col items-center gap-3 border border-evidence-red/60 bg-evidence-red/10 px-6 py-4 text-center text-sm text-parchment-100">
            이 용의자에 대한 질문 횟수를 모두 소진했습니다.
            <Link
              href={`/game/${params.sessionId}?difficulty=${difficulty}`}
              className="border border-brass-600/50 bg-noir-800/80 px-5 py-2 text-xs font-bold text-parchment-100 transition-colors hover:border-brass-400"
            >
              다른 용의자 심문하기 →
            </Link>
          </div>
        ) : (
          <>
            <QuestionInputBar onSubmit={handleAskQuestion} disabled={isWaiting} />
            <p className="text-center text-xs text-parchment-300/40">⚠ 무의미한 질문도 횟수가 차감됩니다.</p>
          </>
        )}

        <div className="text-center">
          <Link href={`/game/${params.sessionId}?difficulty=${difficulty}`} className="text-xs text-parchment-300/50 underline-offset-2 hover:underline">
            ← 용의자 목록으로
          </Link>
        </div>
      </div>
    </main>
  );
}
