import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildReportPrompt } from '../src/llm/prompts/report.prompt.js';
import { endingLlm } from '../src/modules/ending/ending.llm.js';
import { endingRepository as repository } from '../src/modules/ending/ending.repository.js';
import { endingService } from '../src/modules/ending/ending.service.js';
import type { EndingDto } from '../src/modules/ending/ending.types.js';

const userId = '00000000-0000-4000-8000-000000000001';
const sessionId = '00000000-0000-4000-8000-000000000002';
const episodeId = '00000000-0000-4000-8000-000000000003';
const selectedId = '00000000-0000-4000-8000-000000000004';
const culpritId = '00000000-0000-4000-8000-000000000005';
const resultId = '00000000-0000-4000-8000-000000000006';
const endingId = '00000000-0000-4000-8000-000000000007';

const selected = { id: selectedId, code: 'GS-01-S2', name: '선택 용의자', age: 42, occupation: '아들' };
const culprit = { id: culpritId, code: 'GS-01-S1', name: '실제 범인', age: 58, occupation: '종부' };
const fixed: EndingDto = {
  endingType: 'TRUE',
  title: '정답 엔딩',
  fixedContent: '서버에 저장된 사건 결말',
  assetUrl: null,
  selectedSuspect: culprit,
  actualCulprit: culprit,
  fullTimeline: [{ occurredAt: '22:00', title: '사건 발생', description: '확정 동선' }],
  motive: '저장된 동기',
  crimeMethod: '저장된 범행 방법',
  evidenceConnections: [{ id: 'e1', code: 'GS-01-E1', title: '증거', description: '확정 증거', relatedClues: [{ id: 'c1', code: 'GS-01-C1', title: '핵심 단서' }] }],
  suspectSecrets: [{ suspect: culprit, facts: ['확정 비밀'], lies: [{ claim: '거짓 주장', truth: '확정 진실', reason: '저장된 이유' }] }],
  missedCoreClues: [{ id: 'c2', code: 'GS-01-C2', title: '놓친 단서', description: '미획득 CORE' }],
  dialectExplanations: [{ code: 'GS-D1', dialectText: '마', standardText: '그만', meaning: '그만하세요', usageContext: '제지' }],
  reportText: null,
  aftermathText: null,
  reportGeneratedAt: null
};

const result = {
  id: resultId,
  selected_suspect_id: culpritId,
  is_correct: true,
  ending_id: endingId,
  result_data: {},
  report_text: null,
  aftermath_text: null,
  report_status: 'PENDING',
  report_generated_at: null
};

beforeEach(() => {
  vi.spyOn(repository, 'findOwnedSession').mockResolvedValue({ id: sessionId, episode_id: episodeId, status: 'COMPLETED' });
  vi.spyOn(repository, 'findResult').mockResolvedValue(result);
  vi.spyOn(repository, 'loadEnding').mockResolvedValue(fixed);
  vi.spyOn(repository, 'claimReport').mockResolvedValue({ action: 'GENERATE' });
  vi.spyOn(repository, 'completeReport').mockResolvedValue({ reportText: '실제 범인을 확인한 형사 보고서', aftermathText: '사건 후일담', generatedAt: '2026-07-13T00:00:00.000Z' });
  vi.spyOn(repository, 'failReport').mockResolvedValue();
  vi.spyOn(repository, 'logReport').mockResolvedValue();
  vi.spyOn(endingLlm, 'generate').mockResolvedValue({
    output: { reportText: '실제 범인을 확인한 형사 보고서', aftermathText: '사건 후일담' }, model: 'test-model', inputTokens: 10, outputTokens: 20, latencyMs: 5
  });
});

afterEach(() => vi.restoreAllMocks());

describe('fixed ending access', () => {
  it('blocks an investigation that is still in progress', async () => {
    vi.mocked(repository.findOwnedSession).mockResolvedValue({ id: sessionId, episode_id: episodeId, status: 'DEDUCTION' });
    await expect(endingService.ending(sessionId, userId)).rejects.toMatchObject({ code: 'ENDING_NOT_AVAILABLE' });
    expect(repository.findResult).not.toHaveBeenCalled();
  });

  it('returns a correct ending with the complete case truth and dialect meanings', async () => {
    const ending = await endingService.ending(sessionId, userId);
    expect(ending).toEqual(fixed);
    expect(ending.actualCulprit).toEqual(culprit);
    expect(ending.fullTimeline).toHaveLength(1);
    expect(ending.evidenceConnections[0].relatedClues).toHaveLength(1);
    expect(ending.dialectExplanations[0].meaning).toBe('그만하세요');
  });

  it.each([
    ['FALSE', '전용 오답 엔딩'],
    ['WRONG_FALLBACK', 'fallback 오답 엔딩']
  ] as const)('returns %s content selected by deduction', async (endingType, title) => {
    vi.mocked(repository.loadEnding).mockResolvedValue({ ...fixed, endingType, title, selectedSuspect: selected });
    await expect(endingService.ending(sessionId, userId)).resolves.toMatchObject({ endingType, title, selectedSuspect: selected, actualCulprit: culprit });
  });

  it('hides another user session', async () => {
    vi.mocked(repository.findOwnedSession).mockResolvedValue(null);
    await expect(endingService.ending(sessionId, 'other-user')).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });
});

describe('investigation report generation', () => {
  it('stores a structured LLM report without changing the fixed judgment', async () => {
    const ending = await endingService.report(sessionId, userId);
    expect(ending).toMatchObject({ endingType: 'TRUE', actualCulprit: culprit, reportText: '실제 범인을 확인한 형사 보고서', aftermathText: '사건 후일담' });
    expect(repository.completeReport).toHaveBeenCalledWith(sessionId, userId, '실제 범인을 확인한 형사 보고서', '사건 후일담');
  });

  it('returns the fixed ending when the LLM fails', async () => {
    vi.mocked(endingLlm.generate).mockRejectedValue(new Error('OPENAI_FAILED'));
    await expect(endingService.report(sessionId, userId)).resolves.toEqual(fixed);
    expect(repository.failReport).toHaveBeenCalledWith(sessionId, userId);
  });

  it('rejects a report that changes the confirmed culprit', async () => {
    vi.mocked(repository.loadEnding).mockResolvedValue({ ...fixed, endingType: 'FALSE', selectedSuspect: selected });
    vi.mocked(endingLlm.generate).mockResolvedValue({
      output: { reportText: '선택 용의자가 범인이라는 보고서', aftermathText: '실제 범인의 행방' },
      model: 'test-model', inputTokens: 10, outputTokens: 20, latencyMs: 5
    });
    await expect(endingService.report(sessionId, userId)).resolves.toMatchObject({ reportText: null, endingType: 'FALSE' });
    expect(repository.completeReport).not.toHaveBeenCalled();
    expect(repository.failReport).toHaveBeenCalled();
  });

  it('reuses the first stored report without another LLM request', async () => {
    vi.mocked(repository.loadEnding).mockResolvedValue({ ...fixed, reportText: '기존 보고서', aftermathText: '기존 후일담', reportGeneratedAt: '2026-07-13T00:00:00.000Z' });
    await expect(endingService.report(sessionId, userId)).resolves.toMatchObject({ reportText: '기존 보고서', aftermathText: '기존 후일담' });
    expect(repository.claimReport).not.toHaveBeenCalled();
    expect(endingLlm.generate).not.toHaveBeenCalled();
  });

  it('reuses a concurrently completed report returned by the database claim', async () => {
    vi.mocked(repository.claimReport).mockResolvedValue({
      action: 'REUSE', reportText: '동시 저장 보고서', aftermathText: '동시 저장 후일담', generatedAt: '2026-07-13T00:00:00.000Z'
    });
    await expect(endingService.report(sessionId, userId)).resolves.toMatchObject({ reportText: '동시 저장 보고서', aftermathText: '동시 저장 후일담' });
    expect(endingLlm.generate).not.toHaveBeenCalled();
  });

  it('uses only fixed server facts in the report prompt', () => {
    const prompt = buildReportPrompt(fixed);
    expect(prompt).toContain('actualCulprit');
    expect(prompt).toContain('확정 증거');
    expect(prompt).not.toContain('responseRules');
    expect(prompt).not.toContain('unlockConditions');
    expect(prompt).not.toContain('system prompt');
  });
});

describe('ending persistence and privacy', () => {
  const migration = readFileSync(new URL('../supabase/migrations/20260713050748_add_ending_reports.sql', import.meta.url), 'utf8');
  const repositorySource = readFileSync(new URL('../src/modules/ending/ending.repository.ts', import.meta.url), 'utf8');

  it('atomically claims one report generation and limits abuse', () => {
    expect(migration).toContain('for update');
    expect(migration).toContain("report_attempt_count >= 3");
    expect(migration).toContain("interval '30 seconds'");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain('from public, anon, authenticated');
  });

  it('loads all timelines after completion but never queries response rule text', () => {
    expect(repositorySource).toContain("from('episode_timelines').select('occurred_at_label, public_description, server_description, sequence_no')");
    expect(repositorySource).not.toContain('suspect_response_rules');
    expect(repositorySource).not.toContain('response_guidance');
  });

  it('uses explicit evidence and suspect relations without exposing internal weights', () => {
    expect(repositorySource).toContain("from('evidence_clue_links').select('evidence_id, clue_id, link_type, explanation')");
    expect(repositorySource).toContain("from('clue_suspect_impacts').select('clue_id, suspect_id, impact_type, explanation')");
    expect(repositorySource).not.toContain("select('clue_id, suspect_id, impact_type, weight");
    expect(JSON.stringify(fixed)).not.toContain('condition_data');
    expect(JSON.stringify(fixed)).not.toContain('unlockCondition');
  });
});
