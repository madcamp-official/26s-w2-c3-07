import Link from "next/link";
import type { Suspect } from "@/features/case/types";

type SuspectStatusCardProps = {
  suspect: Suspect;
  questionsUsed: number;
  questionsPerSuspect: number;
  href: string;
};

export function SuspectStatusCard({ suspect, questionsUsed, questionsPerSuspect, href }: SuspectStatusCardProps) {
  const questionsLeft = questionsPerSuspect - questionsUsed;
  const exhausted = questionsLeft <= 0;

  return (
    <Link
      href={href}
      className={`group relative block overflow-hidden border bg-noir-900/60 transition-colors ${
        exhausted ? "border-brass-600/20 opacity-70" : "border-brass-600/30 hover:border-brass-500/60"
      }`}
    >
      <div className="aspect-[16/10] w-full bg-[radial-gradient(circle_at_40%_28%,#3a322a_0%,#1a1510_55%,#0a0806_100%)]" />

      <div className="p-4">
        <div className="border border-brass-600/30 bg-noir-800/60 px-4 py-2 text-center font-display text-lg text-parchment-200">
          {suspect.name}
        </div>
        <p className="mt-2 text-center text-xs text-parchment-300/60">
          {suspect.age}세 · {suspect.job}
        </p>
        <p
          className={`mt-2 text-center text-xs font-bold ${
            exhausted ? "text-parchment-300/40" : "text-brass-400"
          }`}
        >
          {exhausted ? "질문 완료" : `남은 질문 ${questionsLeft} / ${questionsPerSuspect}`}
        </p>
      </div>
    </Link>
  );
}
