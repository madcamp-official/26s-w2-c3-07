"use client";

import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { getCaseById } from "@/features/case/data";
import type { Difficulty } from "@/features/case/types";
import { useGameSession } from "@/features/session/hooks/useGameSession";

export default function ResultPage() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const difficulty = (searchParams.get("difficulty") as Difficulty | null) ?? "normal";

  const caseData = getCaseById(params.sessionId);
  const { session } = useGameSession(params.sessionId, params.sessionId, difficulty);

  if (!caseData) {
    notFound();
  }

  if (!session?.accusedId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-noir-950 px-6 text-center text-parchment-100">
        <div className="space-y-4">
          <p className="text-sm text-parchment-300/60">아직 범인을 지목하지 않았습니다.</p>
          <Link
            href={`/game/${params.sessionId}/deduction?difficulty=${difficulty}`}
            className="inline-block border border-brass-600/50 bg-noir-800/80 px-5 py-2 text-sm text-parchment-100 hover:border-brass-400"
          >
            최종 추리로 이동
          </Link>
        </div>
      </main>
    );
  }

  const isCorrect = session.accusedId === caseData.culpritId;
  const accused = caseData.suspects.find((s) => s.id === session.accusedId)!;
  const culprit = caseData.suspects.find((s) => s.id === caseData.culpritId)!;
  const falseEnding = !isCorrect
    ? caseData.falseEndings[session.accusedId] ?? {
        wrongLine: "나는 정말 아무 짓도 안 했습니다. 억울합니다.",
        culpritMockLine: "(진범은 별다른 동요 없이 조용히 상황을 지켜본다.)",
      }
    : null;

  return (
    <main
      className={`relative min-h-screen overflow-hidden ${
        isCorrect
          ? "bg-[radial-gradient(ellipse_at_50%_10%,#2a1712_0%,#0a0806_65%,#050403_100%)]"
          : "bg-[radial-gradient(ellipse_at_50%_10%,#141420_0%,#0a0806_65%,#050403_100%)]"
      }`}
    >
      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
        <div className="text-center">
          <p className={`text-xs font-bold tracking-widest ${isCorrect ? "text-evidence-red" : "text-parchment-300/50"}`}>
            {isCorrect ? "CASE SOLVED" : "WRONG ACCUSATION"}
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-parchment-100 md:text-5xl">
            {isCorrect ? "사건 해결" : "오답"}
          </h1>
          <p className="mt-3 text-sm text-parchment-300/60">
            {isCorrect ? `진범 ${culprit.name}이(가) 체포됩니다.` : `무고한 ${accused.name}이(가) 잘못 지목됐습니다.`}
          </p>
        </div>

        {isCorrect ? (
          <div className="border-l-4 border-evidence-red bg-[#e9dfc7] p-6 text-noir-900">
            <p className="text-xs font-bold tracking-widest text-evidence-red">체포 장면</p>
            <p className="mt-2 font-display text-lg italic leading-relaxed">&ldquo;{caseData.trueEndingArrestLine}&rdquo;</p>
            <p className="mt-3 text-right text-sm text-noir-900/60">— {culprit.name}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-l-4 border-brass-600/50 bg-noir-900/70 p-5">
              <p className="text-xs font-bold tracking-widest text-brass-400">{accused.name}의 항변</p>
              <p className="mt-2 italic leading-relaxed text-parchment-100">&ldquo;{falseEnding?.wrongLine}&rdquo;</p>
            </div>
            <div className="border-l-4 border-evidence-red bg-evidence-red/10 p-5">
              <p className="text-xs font-bold tracking-widest text-evidence-red">진범 {culprit.name}의 반응</p>
              <p className="mt-2 italic leading-relaxed text-parchment-100">&ldquo;{falseEnding?.culpritMockLine}&rdquo;</p>
            </div>
          </div>
        )}

        <div className="border border-brass-600/40 bg-[#e9dfc7] p-6 text-noir-900">
          <p className="text-xs font-bold tracking-widest text-evidence-red">사건의 진실</p>
          <p className="mt-2 text-sm leading-relaxed text-noir-900/80">{caseData.truth}</p>
        </div>

        {isCorrect && (
          <div className="border border-brass-600/30 bg-noir-900/60 p-6">
            <p className="text-xs font-bold tracking-widest text-brass-400">에필로그</p>
            <p className="mt-2 text-sm leading-relaxed text-parchment-200">{caseData.trueEndingNarration}</p>
          </div>
        )}

        <div className="flex items-center justify-center">
          <div
            className={`px-8 py-3 text-center ${
              isCorrect ? "border-2 border-evidence-red bg-evidence-red" : "border border-brass-600/40 bg-noir-900/60"
            }`}
          >
            <p className="text-xs tracking-widest text-parchment-100/80">{isCorrect ? "✓ CORRECT" : "✕ WRONG"}</p>
            <p className="font-display text-lg font-bold text-parchment-100">{isCorrect ? "정답입니다" : "오답입니다"}</p>
          </div>
        </div>

        <Link
          href="/regions"
          className="bg-evidence-red py-4 text-center font-display text-lg font-bold text-parchment-100 transition-colors hover:bg-[#c94539]"
        >
          다른 사건 수사하기 →
        </Link>
      </div>
    </main>
  );
}
