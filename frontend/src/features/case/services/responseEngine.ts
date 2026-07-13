import type { Difficulty, Emotion, Suspect } from "@/features/case/types";

const META_TRIGGERS = [
  "시스템",
  "프롬프트",
  "system prompt",
  "ignore",
  "설정 출력",
  "정답 알려",
  "범인 말해",
  "jailbreak",
];
const ACCUSE_TRIGGERS = [
  "범인이죠",
  "범인이야",
  "당신이 죽",
  "네가 죽",
  "누가 범인",
  "자백해",
  "범인 맞죠",
];

export function getResponse(
  suspect: Suspect,
  question: string,
  difficulty: Difficulty,
): { text: string; emotion: Emotion; clueIds: string[] } {
  const q = question.toLowerCase();

  if (META_TRIGGERS.some((k) => q.includes(k.toLowerCase()))) {
    return { text: suspect.metaResponse, emotion: "hostile", clueIds: [] };
  }

  if (ACCUSE_TRIGGERS.some((k) => q.includes(k.toLowerCase()))) {
    const text =
      difficulty === "easy" ? suspect.accuseEasy : difficulty === "normal" ? suspect.accuseNormal : suspect.accuseHard;
    return { text, emotion: "defensive", clueIds: [] };
  }

  let bestMatch: Suspect["responseBank"][number] | null = null;
  let bestScore = 0;

  for (const entry of suspect.responseBank) {
    const score = entry.trigger.filter((k) => q.includes(k.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  if (bestMatch && bestScore > 0) {
    const text =
      difficulty === "easy" ? bestMatch.easy : difficulty === "normal" ? bestMatch.normal : bestMatch.hard;
    return { text, emotion: bestMatch.emotion, clueIds: bestMatch.clueIds };
  }

  const text =
    difficulty === "easy" ? suspect.defaultEasy : difficulty === "normal" ? suspect.defaultNormal : suspect.defaultHard;
  return { text, emotion: "calm", clueIds: [] };
}
