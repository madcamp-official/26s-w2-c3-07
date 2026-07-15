import { sessionRepository as repo } from './session.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { DbSessionStatus, SessionStatus, SessionView } from './session.types.js';

const terminal = new Set<DbSessionStatus>(['COMPLETED', 'ABANDONED', 'EXPIRED', 'ERROR']);
const active = ['CREATED', 'INTRO_VIEWING', 'INTERROGATING', 'READY_TO_DEDUCE', 'SUBMITTED'] satisfies DbSessionStatus[];
const selectable = ['CREATED', 'INTRO_VIEWING', 'INTERROGATING', 'READY_TO_DEDUCE'] satisfies DbSessionStatus[];

export function toApiSessionStatus(status: DbSessionStatus): SessionStatus {
  switch (status) {
    case 'CREATED': return 'READY';
    case 'INTRO_VIEWING': return 'INVESTIGATING';
    case 'INTERROGATING': return 'INTERROGATING';
    case 'READY_TO_DEDUCE':
    case 'SUBMITTED': return 'DEDUCTION';
    case 'COMPLETED': return 'COMPLETED';
    case 'EXPIRED': return 'EXPIRED';
    case 'ABANDONED': return 'ABANDONED';
    case 'ERROR': throw new AppError(500, 'Session is in an error state', 'SESSION_STATE_ERROR');
  }
}

export const remainingSeconds = (expiresAt: string, now = Date.now()) =>
  Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));

async function view(row: Record<string, unknown>, userId: string): Promise<SessionView> {
  let databaseStatus = String(row.status) as DbSessionStatus;
  const seconds = remainingSeconds(String(row.expires_at));
  if (seconds === 0 && !terminal.has(databaseStatus)) {
    await repo.transition(String(row.id), userId, 'EXPIRED', undefined, active);
    databaseStatus = 'EXPIRED';
  }
  const difficultyRequest = typeof row.difficulty === 'string'
    ? Promise.resolve(row.difficulty)
    : repo.difficulty(String(row.difficulty_config_id));
  const [states, evidence, count, difficulty, questionsPerSuspect] = await Promise.all([
    repo.states(String(row.id)), repo.evidence(String(row.id)), repo.clueCount(String(row.id)),
    difficultyRequest, repo.questionsPerSuspect(String(row.difficulty_config_id))
  ]);
  return {
    sessionId: String(row.id), episodeId: String(row.episode_id), difficulty, status: toApiSessionStatus(databaseStatus),
    startedAt: String(row.started_at), expiresAt: String(row.expires_at), remainingSeconds: seconds,
    remainingQuestions: Number(row.remaining_questions), currentSuspectId: row.current_suspect_id as string | null,
    questionsPerSuspect,
    suspectStates: states.map((state) => ({ suspectId: state.suspect_id, emotion: state.current_emotion, questionsAsked: state.questions_used, questionsRemaining: Math.max(0, questionsPerSuspect - state.questions_used) })),
    viewedEvidenceIds: evidence, acquiredClueCount: count
  };
}

async function owned(id: string, userId: string) {
  const row = await repo.findOwned(id, userId);
  if (!row) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
  return row as unknown as Record<string, unknown>;
}

export const sessionService = {
  async create(userId: string, input: { episodeId: string; difficulty: string }) {
    const id = await repo.initialize(userId, input.episodeId, input.difficulty);
    return view(await owned(id, userId), userId);
  },
  async get(id: string, userId: string) { return view(await owned(id, userId), userId); },
  async active(userId: string) {
    const row = await repo.findActive(userId);
    return row ? view(row as unknown as Record<string, unknown>, userId) : null;
  },
  async selectSuspect(id: string, userId: string, suspectId: string) {
    const row = await owned(id, userId);
    if (remainingSeconds(String(row.expires_at)) === 0) throw new AppError(409, 'Session expired', 'SESSION_EXPIRED');
    if (!selectable.some((status) => status === String(row.status))) throw new AppError(409, 'Session cannot return to interrogation', 'SESSION_ALREADY_TERMINATED');
    if (Number(row.remaining_questions) <= 0) throw new AppError(409, 'No questions remaining', 'QUESTION_LIMIT_EXCEEDED');
    if (!await repo.suspectBelongs(String(row.episode_id), suspectId)) throw new AppError(400, 'Suspect not in episode', 'SUSPECT_NOT_IN_EPISODE');
    const updated = await repo.transition(id, userId, 'INTERROGATING', suspectId, selectable);
    if (!updated) throw new AppError(409, 'Session state changed', 'SESSION_ALREADY_TERMINATED');
    return this.get(id, userId);
  },
  async deduction(id: string, userId: string) {
    const row = await owned(id, userId);
    if (String(row.status) === 'SUBMITTED') throw new AppError(409, 'Deduction is being submitted', 'SESSION_ALREADY_IN_DEDUCTION');
    if (['COMPLETED', 'ABANDONED', 'ERROR'].includes(String(row.status))) throw new AppError(409, 'Invalid session state', 'SESSION_STATE_INVALID');
    return this.get(id, userId);
  },
  async abandon(id: string, userId: string) {
    const row = await owned(id, userId);
    if (terminal.has(String(row.status) as DbSessionStatus)) throw new AppError(409, 'Invalid session state', 'SESSION_STATE_INVALID');
    await repo.transition(id, userId, 'ABANDONED', undefined, active);
    return this.get(id, userId);
  }
};
