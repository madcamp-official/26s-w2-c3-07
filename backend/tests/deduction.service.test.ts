import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deductionRepository as repository } from '../src/modules/deduction/deduction.repository.js';
import { submitDeductionSchema } from '../src/modules/deduction/deduction.schema.js';
import { deductionService } from '../src/modules/deduction/deduction.service.js';

const userId = '00000000-0000-4000-8000-000000000001';
const sessionId = '00000000-0000-4000-8000-000000000002';
const suspectId = '00000000-0000-4000-8000-000000000003';
const endingId = '00000000-0000-4000-8000-000000000004';
const resultId = '00000000-0000-4000-8000-000000000005';

const fullResult = {
  resultId,
  selectedSuspectId: suspectId,
  isCorrect: true,
  resolutionType: 'FULL_RESOLUTION' as const,
  acquiredCoreClues: 4,
  totalCoreClues: 4,
  endingId
};

beforeEach(() => {
  vi.spyOn(repository, 'submit').mockResolvedValue(fullResult);
  vi.spyOn(repository, 'findOwnedSession').mockResolvedValue({ id: sessionId });
  vi.spyOn(repository, 'findResult').mockResolvedValue({
    id: resultId,
    selected_suspect_id: suspectId,
    is_correct: true,
    ending_id: endingId,
    result_data: { resolutionType: 'FULL_RESOLUTION', acquiredCoreClues: 4, totalCoreClues: 4 }
  });
});

afterEach(() => vi.restoreAllMocks());

describe('final culprit judgment', () => {
  it('returns FULL_RESOLUTION for the culprit with every CORE clue', async () => {
    await expect(deductionService.submit(sessionId, userId, suspectId)).resolves.toEqual(fullResult);
    expect(repository.submit).toHaveBeenCalledWith(sessionId, userId, suspectId);
  });

  it('returns CULPRIT_CORRECT when the culprit is right but CORE clues are missing', async () => {
    vi.mocked(repository.submit).mockResolvedValue({ ...fullResult, resolutionType: 'CULPRIT_CORRECT', acquiredCoreClues: 2 });
    await expect(deductionService.submit(sessionId, userId, suspectId)).resolves.toMatchObject({ isCorrect: true, resolutionType: 'CULPRIT_CORRECT' });
  });

  it('returns WRONG_SUSPECT without a score', async () => {
    vi.mocked(repository.submit).mockResolvedValue({ ...fullResult, isCorrect: false, resolutionType: 'WRONG_SUSPECT' });
    const result = await deductionService.submit(sessionId, userId, suspectId);
    expect(result).toMatchObject({ isCorrect: false, resolutionType: 'WRONG_SUSPECT' });
    expect(result).not.toHaveProperty('score');
  });

  it('blocks a suspect from another episode', async () => {
    vi.mocked(repository.submit).mockRejectedValue(new Error('DEDUCTION_SUSPECT_NOT_IN_EPISODE'));
    await expect(deductionService.submit(sessionId, userId, suspectId)).rejects.toMatchObject({ code: 'SUSPECT_NOT_IN_EPISODE' });
  });

  it('blocks duplicate submission', async () => {
    vi.mocked(repository.submit).mockRejectedValue(new Error('DEDUCTION_ALREADY_SUBMITTED'));
    await expect(deductionService.submit(sessionId, userId, suspectId)).rejects.toMatchObject({ code: 'DEDUCTION_ALREADY_SUBMITTED' });
  });

  it('hides a session owned by another user', async () => {
    vi.mocked(repository.submit).mockRejectedValue(new Error('DEDUCTION_SESSION_NOT_FOUND'));
    await expect(deductionService.submit(sessionId, 'other-user', suspectId)).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
    vi.mocked(repository.findOwnedSession).mockResolvedValue(null);
    await expect(deductionService.result(sessionId, 'other-user')).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });

  it('returns the stored result through the result API service', async () => {
    await expect(deductionService.result(sessionId, userId)).resolves.toEqual(fullResult);
  });

  it('rejects client-supplied judgment fields and motive', () => {
    expect(submitDeductionSchema.safeParse({ suspectId }).success).toBe(true);
    expect(submitDeductionSchema.safeParse({ suspectId, isCorrect: true }).success).toBe(false);
    expect(submitDeductionSchema.safeParse({ suspectId, score: 100 }).success).toBe(false);
    expect(submitDeductionSchema.safeParse({ suspectId, motive: 'guess' }).success).toBe(false);
  });
});

describe('atomic deduction SQL', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20260713045846_add_final_culprit_judgment.sql', import.meta.url), 'utf8');

  it('uses stored culprit and CORE clues without LLM or score-based judgment', () => {
    expect(sql).toContain('v_episode.culprit_suspect_id');
    expect(sql).toContain("clue.clue_type = 'CORE'");
    expect(sql).not.toContain('openai');
    expect(sql).not.toContain('score integer');
    expect(sql).not.toContain('p_score');
  });

  it('selects a suspect ending and creates WRONG_FALLBACK when missing', () => {
    expect(sql).toContain("ending.conditions ->> 'selected_suspect_id'");
    expect(sql).toContain("v_episode.code || '-WRONG_FALLBACK'");
    expect(sql).toContain('on conflict (code) do nothing');
  });

  it('locks the session and performs all final writes in one database function', () => {
    expect(sql).toContain('for update');
    expect(sql).toContain('insert into public.game_results');
    expect(sql).toContain("set status = 'COMPLETED'");
    expect(sql).toContain('insert into public.user_episode_progress');
    expect(sql).toContain("set search_path = ''");
    expect(sql).not.toMatch(/exception[\s\S]*commit/i);
  });

  it('raises before completion when result creation cannot select an ending, enabling rollback', () => {
    expect(sql.indexOf("raise exception 'DEDUCTION_ENDING_NOT_FOUND'")).toBeLessThan(sql.indexOf('insert into public.game_results'));
    expect(sql).not.toContain('exception when');
  });
});
