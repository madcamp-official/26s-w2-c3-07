import { describe, expect, it } from 'vitest';
import { difficultyLabel, emotionLabel, questionTypeLabel, resolutionLabel, sessionStatusLabel } from '../src/lib/game-labels';

describe('game labels', () => {
  it('translates session status and difficulty values', () => {
    expect(sessionStatusLabel('INTERROGATING')).toBe('심문 중');
    expect(sessionStatusLabel('EXPIRED')).toBe('시간 만료');
    expect(difficultyLabel('hard')).toBe('어려움');
  });

  it('translates emotions and question types consistently', () => {
    expect(emotionLabel('NEUTRAL')).toBe('중립');
    expect(emotionLabel('DEFENSIVE')).toBe('방어적');
    expect(questionTypeLabel('Q-EVIDENCE')).toBe('증거 질문');
  });

  it('translates final result labels without exposing enum values', () => {
    expect(resolutionLabel('FULL_RESOLUTION')).toBe('완전 해결');
  });
});
