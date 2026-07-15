import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { ClueDto, ClueEvaluationSource, EvidenceDto, EvidenceViewRpcResult, OwnedClueSession } from './clue.types.js';

function throwIfError(error: { code?: string; message: string } | null): void {
  if (error) throw toAppError({ code: error.code ?? 'DATABASE_ERROR', message: error.message });
}

export const clueRepository = {
  async findOwnedSession(sessionId: string, userId: string): Promise<OwnedClueSession | null> {
    const { data, error } = await serviceRoleClient.from('game_sessions')
      .select('id, user_id, episode_id').eq('id', sessionId).eq('user_id', userId).maybeSingle();
    throwIfError(error);
    return data;
  },

  async findAcquiredClues(sessionId: string, episodeId: string): Promise<ClueDto[]> {
    const { data: acquired, error: acquiredError } = await serviceRoleClient.from('session_clues')
      .select('clue_id, acquired_at, acquired_from_type, acquired_from_ref').eq('session_id', sessionId).order('acquired_at');
    throwIfError(acquiredError);
    if (!acquired?.length) return [];
    const { data: clues, error: cluesError } = await serviceRoleClient.schema('game_content').from('clues')
      .select('id, code, title, content, record_summary, clue_type, importance, display_order')
      .eq('episode_id', episodeId).in('id', acquired.map((row) => row.clue_id)).order('display_order');
    throwIfError(cluesError);
    const acquiredById = new Map(acquired.map((row) => [row.clue_id, row]));
    return (clues ?? []).map((clue) => {
      const state = acquiredById.get(clue.id)!;
      return {
        id: clue.id, code: clue.code, title: clue.title, content: clue.content,
        description: clue.content, recordSummary: clue.record_summary, clueType: clue.clue_type,
        importance: clue.importance, unlockedAt: state.acquired_at, source: state.acquired_from_type
      };
    });
  },

  async findAvailableEvidence(sessionId: string, episodeId: string): Promise<EvidenceDto[]> {
    const { data: available, error: availableError } = await serviceRoleClient.from('session_evidence')
      .select('evidence_id, source_type, discovered_at, viewed_at').eq('session_id', sessionId).order('discovered_at');
    throwIfError(availableError);
    if (!available?.length) return [];
    const { data: evidence, error: evidenceError } = await serviceRoleClient.schema('game_content').from('evidence')
      .select('id, code, title, description, evidence_type, display_order')
      .eq('episode_id', episodeId).in('id', available.map((row) => row.evidence_id)).order('display_order');
    throwIfError(evidenceError);
    const stateById = new Map(available.map((row) => [row.evidence_id, row]));
    return (evidence ?? []).map((item) => {
      const state = stateById.get(item.id)!;
      return { id: item.id, code: item.code, title: item.title, description: item.description, evidenceType: item.evidence_type, discoveredAt: state.discovered_at, viewedAt: state.viewed_at, source: state.source_type };
    });
  },

  async evaluate(sessionId: string, userId: string, source: ClueEvaluationSource): Promise<string[]> {
    const { data, error } = await serviceRoleClient.rpc('evaluate_session_clues', { p_user_id: userId, p_session_id: sessionId, p_source: source });
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  async viewEvidence(sessionId: string, userId: string, evidenceId: string): Promise<EvidenceViewRpcResult> {
    const { data, error } = await serviceRoleClient.rpc('view_session_evidence', { p_user_id: userId, p_session_id: sessionId, p_evidence_id: evidenceId });
    if (error) throw new Error(error.message);
    const value = data && typeof data === 'object' && !Array.isArray(data) ? data as Record<string, unknown> : {};
    return {
      evidenceId: typeof value.evidenceId === 'string' ? value.evidenceId : evidenceId,
      viewedAt: typeof value.viewedAt === 'string' ? value.viewedAt : new Date().toISOString(),
      newClueIds: Array.isArray(value.newClueIds) ? value.newClueIds.filter((id): id is string => typeof id === 'string') : [],
      newEvidenceIds: Array.isArray(value.newEvidenceIds) ? value.newEvidenceIds.filter((id): id is string => typeof id === 'string') : []
    };
  }
};
