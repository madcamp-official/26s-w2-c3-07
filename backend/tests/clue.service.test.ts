import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isClueUnlocked } from '../src/game/clue.rule.js';
import { clueRepository as repository } from '../src/modules/clue/clue.repository.js';
import { clueService, evaluateClueUnlocks } from '../src/modules/clue/clue.service.js';

const userId = '00000000-0000-4000-8000-000000000001';
const sessionId = '00000000-0000-4000-8000-000000000002';
const episodeId = '00000000-0000-4000-8000-000000000003';
const evidenceId = '00000000-0000-4000-8000-000000000004';
const clueId = '00000000-0000-4000-8000-000000000005';

const clue = { id: clueId, code: 'GS-01-C1', title: '독성 물질', description: '차에서 독이 검출됐다.', clueType: 'CORE', unlockedAt: new Date().toISOString(), source: 'EVIDENCE_VIEWED' };
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
  const sql = readFileSync(new URL('../supabase/migrations/20260713043847_add_server_side_clue_unlocking.sql', import.meta.url), 'utf8');

  it('deduplicates clue acquisition and implements AND/OR grouping', () => {
    expect(sql).toContain('bool_and');
    expect(sql).toContain('group by condition.group_no');
    expect(sql).toContain('on conflict (session_id, clue_id) do nothing');
  });

  it('evaluates FACT_USED and QUESTION_TYPE_ASKED from stored messages', () => {
    expect(sql).toContain("v_condition.condition_type = 'FACT_USED'");
    expect(sql).toContain("message.response_metadata -> 'usedFactIds'");
    expect(sql).toContain("v_condition.condition_type = 'QUESTION_TYPE_ASKED'");
    expect(sql).toContain("message.response_metadata ->> 'questionType'");
  });

  it('supports all declared condition types and never accepts an LLM clue-id list', () => {
    for (const type of ['EVIDENCE_VIEWED','QUESTION_TYPE_ASKED','FACT_USED','CLUE_ACQUIRED','SUSPECT_INTERROGATED','MESSAGE_EXISTS','EMOTION_REACHED']) expect(sql).toContain(type);
    expect(sql).not.toContain('p_clue_ids');
    expect(sql).toContain("set search_path = ''");
    expect(sql).toContain('from public.interrogation_messages');
    expect(sql).toContain('from public.session_evidence');
  });
});
