export type Difficulty = 'easy' | 'normal' | 'hard';

export const questionLimitByDifficulty: Record<Difficulty, number> = {
  easy: 30,
  normal: 20,
  hard: 12
};
