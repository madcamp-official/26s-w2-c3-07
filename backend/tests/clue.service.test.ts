import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { evaluateClueConditions, isClueUnlocked, type ClueEvaluationContext } from '../src/game/clue.rule.js';
import { clueRepository as repository } from '../src/modules/clue/clue.repository.js';
import { clueService, evaluateClueUnlocks } from '../src/modules/clue/clue.service.js';

const userId = '00000000-0000-4000-8000-000000000001';
const sessionId = '00000000-0000-4000-8000-000000000002';
const episodeId = '00000000-0000-4000-8000-000000000003';
const evidenceId = '00000000-0000-4000-8000-000000000004';
const clueId = '00000000-0000-4000-8000-000000000005';

const clue = { id: clueId, code: 'GS-01-C1', title: '독성 물질', content: '차에서 독이 검출됐다.', description: '차에서 독이 검출됐다.', recordSummary: '찻잔에서 독 검출', clueType: 'CORE', importance: 'CORE', unlockedAt: new Date().toISOString(), source: 'EVIDENCE_VIEWED' };
const evidence = { id: evidenceId, code: 'GS-01-E1', title: '찻잔', description: '사건 현장의 찻잔', evidenceType: 'physical', discoveredAt: new Date().toISOString(), viewedAt: new Date().toISOString() };

beforeEach(() => {
  vi.spyOn(repository, 'findOwnedSession').mockResolvedValue({ id: sessionId, user_id: userId, episode_id: episodeId });
  vi.spyOn(repository, 'findAcquiredClues').mockResolvedValue([clue]);
  vi.spyOn(repository, 'findAvailableEvidence').mockResolvedValue([evidence]);
  vi.spyOn(repository, 'viewEvidence').mockResolvedValue({ evidenceId, viewedAt: evidence.viewedAt!, newClueIds: [clueId] });
  vi.spyOn(repository, 'evaluate').mockResolvedValue([clueId]);
});
afterEach(() => vi.restoreAllMocks());

describe('clue group rules', () => {
  it('unlocks a single true condition', () => expect(isClueUnlocked([{ groupNo: 1, met: true }])).toBe(true));
  it('requires every condition in the same AND group', () => expect(isClueUnlocked([{ groupNo: 1, met: true }, { groupNo: 1, met: false }])).toBe(false));
  it('unlocks when any OR group is fully true', () => expect(isClueUnlocked([
    { groupNo: 1, met: true }, { groupNo: 1, met: false },
    { groupNo: 2, met: true }, { groupNo: 2, met: true }
  ])).toBe(true));
});

const context = (overrides: Partial<ClueEvaluationContext> = {}): ClueEvaluationContext => ({
  viewedEvidenceIds: new Set(), presentedEvidenceIds: new Set(), questionType: null, suspectId: null,
  usedFactIds: new Set(), revealedFactIds: new Set(), claimedFactIds: new Set(), acquiredClueIds: new Set(),
  ...overrides
});
const condition = (groupNo: number, conditionType: string, targetRef: string) => ({
  groupNo, conditionType, targetRef, operator: 'EQ' as const, expectedValue: true
});

describe('data-driven clue condition evaluation', () => {
  it.each([
    ['GS-01', 'GS-01-E1', 'GS-01-F1'],
    ['JL-01', 'JL-01-E6', 'JL-01-F1'],
    ['CC-01', 'CC-01-E1', 'CC-01-F1'],
    ['JJ-01', 'JJ-01-E1', 'JJ-01-F1']
  ])('evaluates one data-defined unlock path for %s', (_episode, evidenceRef, factRef) => {
    expect(evaluateClueConditions([
      condition(1, 'EVIDENCE_VIEWED', evidenceRef), condition(1, 'FACT_REVEALED', factRef)
    ], context({ viewedEvidenceIds: new Set([evidenceRef]), revealedFactIds: new Set([factRef]) }))).toBe(true);
  });

  it('does not unlock testimony from an unrelated time question', () => {
    expect(evaluateClueConditions([condition(1, 'FACT_REVEALED', 'fact-alibi')], context({ questionType: 'Q-TIME' }))).toBe(false);
  });

  it('does not unlock when question type matches but no fact was revealed', () => {
    expect(evaluateClueConditions([
      condition(1, 'QUESTION_TYPE_ASKED', 'Q-TIME'), condition(1, 'FACT_REVEALED', 'fact-alibi')
    ], context({ questionType: 'Q-TIME' }))).toBe(false);
  });

  it('does not treat a fact used internally as revealed', () => {
    expect(evaluateClueConditions([condition(1, 'FACT_REVEALED', 'fact-alibi')], context({ usedFactIds: new Set(['fact-alibi']) }))).toBe(false);
  });

  it('combines revealed facts accumulated over separate interrogation turns', () => {
    expect(evaluateClueConditions([
      condition(1, 'FACT_REVEALED', 'visit-time'), condition(1, 'FACT_REVEALED', 'night-alibi')
    ], context({ revealedFactIds: new Set(['visit-time', 'night-alibi']) }))).toBe(true);
  });

  it('recognizes presented evidence only from the current turn', () => {
    const jjTea = condition(1, 'EVIDENCE_PRESENTED', 'JJ-01-E1');
    expect(evaluateClueConditions([jjTea], context({ viewedEvidenceIds: new Set(['JJ-01-E1']) }))).toBe(false);
    expect(evaluateClueConditions([jjTea], context({ presentedEvidenceIds: new Set(['JJ-01-E1']) }))).toBe(true);
  });

  it('requires every condition in a JL-01-C3 AND group', () => {
    const conditions = [condition(1, 'EVIDENCE_PRESENTED', 'JL-01-E6'), condition(1, 'FACT_REVEALED', 'JL-01-F-OFFICE-ALIBI')];
    expect(evaluateClueConditions(conditions, context({ presentedEvidenceIds: new Set(['JL-01-E6']) }))).toBe(false);
    expect(evaluateClueConditions(conditions, context({ presentedEvidenceIds: new Set(['JL-01-E6']), revealedFactIds: new Set(['JL-01-F-OFFICE-ALIBI']) }))).toBe(true);
  });

  it('unlocks when either OR group is complete', () => {
    expect(evaluateClueConditions([
      condition(1, 'FACT_REVEALED', 'missing'), condition(2, 'CLUE_ACQUIRED', 'alternate')
    ], context({ acquiredClueIds: new Set(['alternate']) }))).toBe(true);
  });

  it('opens JJ-01-C6 only after both teacup and medicine wrapper are viewed', () => {
    const conditions = [condition(1, 'EVIDENCE_VIEWED', 'JJ-01-E-TEACUP'), condition(1, 'EVIDENCE_VIEWED', 'JJ-01-E-WRAPPER')];
    expect(evaluateClueConditions(conditions, context({ viewedEvidenceIds: new Set(['JJ-01-E-TEACUP']) }))).toBe(false);
    expect(evaluateClueConditions(conditions, context({ viewedEvidenceIds: new Set(['JJ-01-E-TEACUP', 'JJ-01-E-WRAPPER']) }))).toBe(true);
  });

  it('opens JJ-01-C1 when Mun Tae-o visit time and night alibi are both revealed', () => {
    expect(evaluateClueConditions([
      condition(1, 'FACT_REVEALED', 'JJ-01-F-MUN-VISIT'), condition(1, 'FACT_REVEALED', 'JJ-01-F-MUN-NIGHT')
    ], context({ revealedFactIds: new Set(['JJ-01-F-MUN-VISIT', 'JJ-01-F-MUN-NIGHT']) }))).toBe(true);
  });

  it('does not open JJ-01-C4 from presenting the call log without the threat fact', () => {
    const conditions = [condition(1, 'EVIDENCE_PRESENTED', 'JJ-01-E-CALL'), condition(1, 'FACT_REVEALED', 'JJ-01-F-THREAT')];
    expect(evaluateClueConditions(conditions, context({ presentedEvidenceIds: new Set(['JJ-01-E-CALL']) }))).toBe(false);
  });

  it('opens JJ-01-C4 once the threat fact is also revealed', () => {
    const conditions = [condition(1, 'EVIDENCE_PRESENTED', 'JJ-01-E-CALL'), condition(1, 'FACT_REVEALED', 'JJ-01-F-THREAT')];
    expect(evaluateClueConditions(conditions, context({ presentedEvidenceIds: new Set(['JJ-01-E-CALL']), revealedFactIds: new Set(['JJ-01-F-THREAT']) }))).toBe(true);
  });

  it('records an unknown condition and evaluates it as false', () => {
    const unknown = vi.fn();
    expect(evaluateClueConditions([condition(1, 'UNSUPPORTED', 'anything')], context(), unknown)).toBe(false);
    expect(unknown).toHaveBeenCalledWith('UNSUPPORTED');
  });
});

describe('server-side clue service', () => {
  it('returns acquired clues without unlock conditions or culprit support metadata', async () => {
    const result = await clueService.listClues(sessionId, userId);
    expect(result).toEqual([clue]);
    expect(JSON.stringify(result)).not.toContain('condition');
    expect(JSON.stringify(result)).not.toContain('supportsCulpritId');
  });

  it('returns only evidence made available to the session', async () => {
    await expect(clueService.listEvidence(sessionId, userId)).resolves.toEqual([evidence]);
    expect(repository.findAvailableEvidence).toHaveBeenCalledWith(sessionId, episodeId);
  });

  it('views evidence and returns only clues inserted by the server evaluator', async () => {
    await expect(clueService.viewEvidence(sessionId, userId, evidenceId)).resolves.toEqual({ evidence, newClues: [clue] });
    expect(repository.viewEvidence).toHaveBeenCalledWith(sessionId, userId, evidenceId);
  });

  it('blocks evidence from a different episode', async () => {
    vi.mocked(repository.viewEvidence).mockRejectedValue(new Error('EVIDENCE_NOT_IN_EPISODE'));
    await expect(clueService.viewEvidence(sessionId, userId, evidenceId)).rejects.toMatchObject({ code: 'EVIDENCE_NOT_IN_EPISODE' });
  });

  it('blocks undiscovered evidence', async () => {
    vi.mocked(repository.viewEvidence).mockRejectedValue(new Error('EVIDENCE_NOT_AVAILABLE'));
    await expect(clueService.viewEvidence(sessionId, userId, evidenceId)).rejects.toMatchObject({ code: 'EVIDENCE_NOT_AVAILABLE' });
  });

  it('blocks another session owner', async () => {
    vi.mocked(repository.findOwnedSession).mockResolvedValue(null);
    await expect(clueService.listClues(sessionId, 'other-user')).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });

  it('evaluates from a server context that has no clue-id input', async () => {
    await expect(evaluateClueUnlocks(sessionId, userId, { source: 'INTERROGATION' })).resolves.toEqual([clueId]);
    expect(repository.evaluate).toHaveBeenCalledWith(sessionId, userId, 'INTERROGATION');
  });
});

describe('clue SQL enforcement', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20260714072622_llm_clue_unlock_integration.sql', import.meta.url), 'utf8');

  it('deduplicates clue acquisition and implements AND/OR grouping', () => {
    expect(sql).toContain('bool_and');
    expect(sql).toContain('group by condition.group_no');
    expect(sql).toContain('on conflict (session_id, clue_id) do nothing');
  });

  it('evaluates revealed and claimed facts separately from legacy fact usage', () => {
    expect(sql).toContain("v_condition.condition_type = 'FACT_USED'");
    expect(sql).toContain("v_condition.condition_type = 'FACT_REVEALED'");
    expect(sql).toContain('message.revealed_fact_refs');
    expect(sql).toContain("v_condition.condition_type = 'CLAIM_RECORDED'");
    expect(sql).toContain('message.claimed_fact_refs');
  });

  it('supports all declared condition types and never accepts an LLM clue-id list', () => {
    for (const type of ['EVIDENCE_VIEWED','EVIDENCE_PRESENTED','QUESTION_TYPE_ASKED','SUSPECT_INTERROGATED','FACT_USED','FACT_REVEALED','CLAIM_RECORDED','CLUE_ACQUIRED']) expect(sql).toContain(type);
    expect(sql).not.toContain('p_clue_ids');
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain('from public.interrogation_messages');
    expect(sql).toContain('from public.session_evidence');
  });
});
