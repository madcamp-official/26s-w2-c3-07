import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionRepository as repository } from '../src/modules/session/session.repository.js';
import { remainingSeconds, sessionService, toApiSessionStatus } from '../src/modules/session/session.service.js';
import { createSessionSchema } from '../src/modules/session/session.schema.js';

const row = (overrides: Record<string, unknown> = {}) => ({
  id: 'session-1',
  user_id: 'user-1',
  episode_id: 'episode-1',
  difficulty_config_id: 'difficulty-1',
  status: 'CREATED',
  remaining_questions: 6,
  started_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 60_000).toISOString(),
  current_suspect_id: null,
  ...overrides
});

const mockViewDependencies = () => {
  vi.spyOn(repository, 'states').mockResolvedValue([
    { suspect_id: 's1', current_emotion: 'NEUTRAL', questions_used: 0 },
    { suspect_id: 's2', current_emotion: 'NEUTRAL', questions_used: 0 },
    { suspect_id: 's3', current_emotion: 'NEUTRAL', questions_used: 0 },
    { suspect_id: 's4', current_emotion: 'NEUTRAL', questions_used: 0 }
  ]);
  vi.spyOn(repository, 'evidence').mockResolvedValue(['e1']);
  vi.spyOn(repository, 'clueCount').mockResolvedValue(0);
  vi.spyOn(repository, 'difficulty').mockResolvedValue('hard');
  vi.spyOn(repository, 'questionsPerSuspect').mockResolvedValue(2);
};

afterEach(() => vi.restoreAllMocks());

describe('session lifecycle', () => {
  it('rejects an invalid difficulty', () => {
    expect(createSessionSchema.safeParse({
      episodeId: '00000000-0000-4000-8000-000000000001',
      difficulty: 'impossible'
    }).success).toBe(false);
  });

  it.each([
    ['CREATED', 'READY'],
    ['INTRO_VIEWING', 'INVESTIGATING'],
    ['INTERROGATING', 'INTERROGATING'],
    ['READY_TO_DEDUCE', 'DEDUCTION'],
    ['SUBMITTED', 'DEDUCTION'],
    ['COMPLETED', 'COMPLETED'],
    ['EXPIRED', 'EXPIRED'],
    ['ABANDONED', 'ABANDONED']
  ] as const)('maps DB status %s to API status %s', (databaseStatus, apiStatus) => {
    expect(toApiSessionStatus(databaseStatus)).toBe(apiStatus);
  });

  it('rejects the DB ERROR state explicitly', () => {
    expect(() => toApiSessionStatus('ERROR')).toThrowError(expect.objectContaining({ code: 'SESSION_STATE_ERROR' }));
  });

  it('creates from RPC and returns four states, initial evidence, and JJ hard six questions', async () => {
    mockViewDependencies();
    vi.spyOn(repository, 'initialize').mockResolvedValue('session-1');
    vi.spyOn(repository, 'findOwned').mockResolvedValue(row());
    const view = await sessionService.create('user-1', { episodeId: 'episode-1', difficulty: 'hard' });
    expect(repository.initialize).toHaveBeenCalledWith('user-1', 'episode-1', 'hard');
    expect(view).toMatchObject({ status: 'READY', difficulty: 'hard', remainingQuestions: 6, questionsPerSuspect: 2 });
    expect(view.suspectStates).toHaveLength(4);
    expect(view.suspectStates[0]).toMatchObject({ questionsAsked: 0, questionsRemaining: 2 });
    expect(view.viewedEvidenceIds).toEqual(['e1']);
  });

  it('blocks another owner', async () => {
    vi.spyOn(repository, 'findOwned').mockResolvedValue(null);
    await expect(sessionService.get('session-1', 'other')).rejects.toMatchObject({ code: 'SESSION_NOT_FOUND' });
  });

  it('computes server remaining time', () => {
    expect(remainingSeconds(new Date(11_000).toISOString(), 1_000)).toBe(10);
  });

  it('expires an active DB state using server time', async () => {
    mockViewDependencies();
    vi.spyOn(repository, 'findOwned').mockResolvedValue(row({ expires_at: new Date(Date.now() - 1_000).toISOString() }));
    const transition = vi.spyOn(repository, 'transition').mockResolvedValue(row({ status: 'EXPIRED' }));
    await expect(sessionService.get('session-1', 'user-1')).resolves.toMatchObject({ status: 'EXPIRED', remainingSeconds: 0 });
    expect(transition).toHaveBeenCalledWith('session-1', 'user-1', 'EXPIRED', undefined,
      ['CREATED', 'INTRO_VIEWING', 'INTERROGATING', 'READY_TO_DEDUCE', 'SUBMITTED']);
  });

  it('selects only a suspect in the episode with a conditional DB update', async () => {
    mockViewDependencies();
    vi.spyOn(repository, 'findOwned').mockResolvedValue(row());
    vi.spyOn(repository, 'suspectBelongs').mockResolvedValue(true);
    const transition = vi.spyOn(repository, 'transition').mockResolvedValue(row({ status: 'INTERROGATING' }));
    await sessionService.selectSuspect('session-1', 'user-1', 's1');
    expect(transition).toHaveBeenCalledWith('session-1', 'user-1', 'INTERROGATING', 's1',
      ['CREATED', 'INTRO_VIEWING', 'INTERROGATING']);
  });

  it.each(['COMPLETED', 'ABANDONED', 'EXPIRED'] as const)('rejects suspect selection for %s sessions', async (status) => {
    vi.spyOn(repository, 'findOwned').mockResolvedValue(row({ status }));
    await expect(sessionService.selectSuspect('session-1', 'user-1', 's1'))
      .rejects.toMatchObject({ code: 'SESSION_ALREADY_TERMINATED' });
  });

  it.each(['READY_TO_DEDUCE', 'SUBMITTED'] as const)('rejects duplicate deduction for %s', async (status) => {
    vi.spyOn(repository, 'findOwned').mockResolvedValue(row({ status }));
    await expect(sessionService.deduction('session-1', 'user-1'))
      .rejects.toMatchObject({ code: 'SESSION_ALREADY_IN_DEDUCTION' });
  });

  it('abandons an active session using the DB status set', async () => {
    mockViewDependencies();
    vi.spyOn(repository, 'findOwned').mockResolvedValue(row());
    const transition = vi.spyOn(repository, 'transition').mockResolvedValue(row({ status: 'ABANDONED' }));
    await sessionService.abandon('session-1', 'user-1');
    expect(transition).toHaveBeenCalledWith('session-1', 'user-1', 'ABANDONED', undefined,
      ['CREATED', 'INTRO_VIEWING', 'INTERROGATING', 'READY_TO_DEDUCE', 'SUBMITTED']);
  });
});
