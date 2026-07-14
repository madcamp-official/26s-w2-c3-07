import type { QuestionType, SuspectKnowledge } from './interrogation.types.js';

type DialectExpression = SuspectKnowledge['dialectExpressions'][number];

const limits: Record<string, number> = { easy: 5, normal: 7, hard: 10 };
const categoryCaps: Record<string, number> = {
  VOCABULARY: 2,
  ENDING: 2,
  FILLER: 1,
  EMOTION: 1,
  EVASION: 1
};

export function selectDialectExpressions(
  expressions: DialectExpression[],
  questionType: QuestionType,
  currentEmotion: string,
  difficulty: string,
  dialectLevel: number
): DialectExpression[] {
  const limit = limits[difficulty] ?? limits.normal;
  const rows = expressions
    .filter((row) => ['APPROVED_FOR_MVP', 'VERIFIED'].includes(row.verificationStatus))
    .filter((row) => row.intensity <= dialectLevel)
    .sort((a, b) => {
      const score = (row: DialectExpression) => (row.questionTypes.includes(questionType) ? 4 : 0)
        + (row.emotionTags.includes(currentEmotion) ? 2 : 0)
        + (row.verificationStatus === 'VERIFIED' ? 1 : 0);
      return score(b) - score(a) || a.code.localeCompare(b.code);
    });
  const categoryCounts = new Map<string, number>();
  return rows.filter((row) => {
    const cap = categoryCaps[row.category] ?? limit;
    const count = categoryCounts.get(row.category) ?? 0;
    if (count >= cap) return false;
    categoryCounts.set(row.category, count + 1);
    return true;
  }).slice(0, limit);
}
