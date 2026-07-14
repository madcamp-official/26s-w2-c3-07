import { AppError } from '../../shared/errors/app-error.js';
import { recordRepository as repository } from './record.repository.js';
import type { InvestigationRecord, NoteInput, NotePatch } from './record.types.js';

async function owned(sessionId: string, userId: string) {
  const session = await repository.findOwnedSession(sessionId, userId);
  if (!session) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
  return session;
}

async function validateSuspect(episodeId: string, suspectId: string | null | undefined): Promise<void> {
  if (suspectId && !await repository.suspectBelongs(episodeId, suspectId)) throw new AppError(400, 'Suspect not in episode', 'SUSPECT_NOT_IN_EPISODE');
}

export const recordService = {
  async records(sessionId: string, userId: string): Promise<InvestigationRecord> {
    const session = await owned(sessionId, userId);
    const [{ overview, regionId }, clueIds] = await Promise.all([repository.findOverview(session.episode_id), repository.acquiredClueIds(session.id)]);
    const [evidence, testimonies, timeline, clues, dialectExpressions, relationships, notes] = await Promise.all([
      repository.findEvidence(session.id, session.episode_id),
      repository.findTestimonies(session.id, session.episode_id),
      repository.findTimeline(session.episode_id, clueIds),
      repository.findClues(session.id, session.episode_id),
      repository.findDialects(session.episode_id, session.status === 'COMPLETED'),
      repository.findRelationships(session.episode_id, clueIds),
      repository.findNotes(session.id, userId)
    ]);
    return { caseOverview: overview, evidence, testimonies, timeline, clues, dialectExpressions, relationships, notes };
  },

  async testimonies(sessionId: string, userId: string) { const session = await owned(sessionId,userId); return repository.findTestimonies(session.id,session.episode_id); },
  async timeline(sessionId: string, userId: string) { const session = await owned(sessionId,userId); return repository.findTimeline(session.episode_id,await repository.acquiredClueIds(session.id)); },
  async relationships(sessionId: string, userId: string) { const session = await owned(sessionId,userId); return repository.findRelationships(session.episode_id,await repository.acquiredClueIds(session.id)); },

  async createNote(sessionId: string, userId: string, input: NoteInput) {
    const session = await owned(sessionId,userId); await validateSuspect(session.episode_id,input.suspectId); return repository.createNote(session.id,userId,input);
  },
  async updateNote(sessionId: string, userId: string, noteId: string, patch: NotePatch) {
    const session = await owned(sessionId,userId); await validateSuspect(session.episode_id,patch.suspectId);
    const note = await repository.updateNote(session.id,userId,noteId,patch); if (!note) throw new AppError(404,'Note not found','NOTE_NOT_FOUND'); return note;
  },
  async deleteNote(sessionId: string, userId: string, noteId: string) {
    const session = await owned(sessionId,userId); if (!await repository.deleteNote(session.id,userId,noteId)) throw new AppError(404,'Note not found','NOTE_NOT_FOUND'); return { deleted: true, noteId };
  }
};
