"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { getCaseById } from "@/features/case/data";
import type { Difficulty } from "@/features/case/types";
import { QUESTIONS_PER_SUSPECT } from "@/features/case/types";
import { SessionProgressBar } from "@/features/session/components/SessionProgressBar";
import { SuspectStatusCard } from "@/features/session/components/SuspectStatusCard";
import { useGameSession } from "@/features/session/hooks/useGameSession";

export default function GameSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const difficulty = (searchParams.get("difficulty") as Difficulty | null) ?? "normal";

  const caseData = getCaseById(params.sessionId);
  const { session } = useGameSession(params.sessionId, params.sessionId, difficulty);

  if (!caseData) {
    notFound();
  }

  const questionsPerSuspect = QUESTIONS_PER_SUSPECT[difficulty];
  const totalQuestions = questionsPerSuspect * caseData.suspects.length;
  const totalQuestionsUsed = session?.conversations.reduce((acc, c) => acc + c.questionsUsed, 0) ?? 0;
  const totalQuestionsLeft = Math.max(totalQuestions - totalQuestionsUsed, 0);
  const cluesFound = session?.foundClueIds.length ?? 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_50%_10%,#1c1712_0%,#0a0806_65%,#050403_100%)]">
      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col gap-8 px-6 py-12">
        <div className="flex items-center justify-between">
          <BackButton href={`/episodes/${caseData.id}?difficulty=${difficulty}`} label="사건 개요로" />
          <Link
            href={`/game/${params.sessionId}/records?difficulty=${difficulty}`}
            className="border border-brass-600/50 bg-noir-800/80 px-4 py-2 text-sm text-parchment-100 transition-colors hover:border-brass-400"
          >
            사건 기록 열람
          </Link>
        </div>

        <div className="text-center">
          <p className="text-xs font-bold tracking-widest text-evidence-red">{caseData.regionName}</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-parchment-100 md:text-4xl">{caseData.title}</h1>
          <p className="mt-2 text-sm text-parchment-300/60">심문할 용의자를 선택하세요.</p>
        </div>

        <SessionProgressBar
          totalQuestionsLeft={totalQuestionsLeft}
          totalQuestions={totalQuestions}
          cluesFound={cluesFound}
          cluesTotal={caseData.clues.length}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {caseData.suspects.map((suspect) => {
            const questionsUsed =
              session?.conversations.find((c) => c.suspectId === suspect.id)?.questionsUsed ?? 0;
            return (
              <SuspectStatusCard
                key={suspect.id}
                suspect={suspect}
                questionsUsed={questionsUsed}
                questionsPerSuspect={questionsPerSuspect}
                href={`/game/${params.sessionId}/interrogation/${suspect.id}?difficulty=${difficulty}`}
              />
            );
          })}
        </div>

        <Link
          href={`/game/${params.sessionId}/deduction?difficulty=${difficulty}`}
          className="mt-4 flex items-center justify-center gap-2 bg-evidence-red py-4 font-display text-lg font-bold text-parchment-100 transition-colors hover:bg-[#c94539]"
        >
          최종 추리로 넘어가기 →
        </Link>
        <p className="text-center text-xs text-parchment-300/40">
          질문 횟수가 남아 있어도 언제든 최종 추리로 넘어갈 수 있습니다.
        </p>
      </div>
    </main>
  );
}
