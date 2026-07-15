import { AppError } from '../../shared/errors/app-error.js';
import { clueRepository as repository } from './clue.repository.js';
import type { ClueEvaluationSource } from './clue.types.js';

async function owned(sessionId: string, userId: string) {
  const session = await repository.findOwnedSession(sessionId, userId);
  if (!session) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
  return session;
}

function mapEvidenceError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('EVIDENCE_NOT_IN_EPISODE')) throw new AppError(400, 'Evidence does not belong to this episode', 'EVIDENCE_NOT_IN_EPISODE');
  if (message.includes('EVIDENCE_NOT_AVAILABLE')) throw new AppError(404, 'Evidence is not available in this session', 'EVIDENCE_NOT_AVAILABLE');
  if (message.includes('CLUE_SESSION_NOT_FOUND')) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
  throw error;
}

export async function evaluateClueUnlocks(sessionId: string, userId: string, context: { source: ClueEvaluationSource }): Promise<string[]> {
  await owned(sessionId, userId);
  return repository.evaluate(sessionId, userId, context.source);
}

export const clueService = {
  async listClues(sessionId: string, userId: string) {
    const session = await owned(sessionId, userId);
    return repository.findAcquiredClues(session.id, session.episode_id);
  },

  async listEvidence(sessionId: string, userId: string) {
    const session = await owned(sessionId, userId);
    return repository.findAvailableEvidence(session.id, session.episode_id);
  },

  async viewEvidence(sessionId: string, userId: string, evidenceId: string) {
    const session = await owned(sessionId, userId);
    try {
      const viewed = await repository.viewEvidence(session.id, userId, evidenceId);
      const [evidence, clues] = await Promise.all([
        repository.findAvailableEvidence(session.id, session.episode_id),
        repository.findAcquiredClues(session.id, session.episode_id)
      ]);
      return {
        evidence: evidence.find((item) => item.id === evidenceId) ?? null,
        newClues: clues.filter((clue) => viewed.newClueIds.includes(clue.id)),
        newlyUnlockedEvidence: evidence.filter((item) => viewed.newEvidenceIds.includes(item.id))
      };
    } catch (error) {
      return mapEvidenceError(error);
    }
  }
};
