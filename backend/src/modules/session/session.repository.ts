import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';

const cols = 'id, user_id, episode_id, difficulty_config_id, status, remaining_questions, started_at, expires_at, current_suspect_id';

export const sessionRepository = {
  async initialize(userId: string, episodeId: string, difficulty: string) {
    const { data, error } = await serviceRoleClient.rpc('initialize_game_session', { p_user_id: userId, p_episode_id: episodeId, p_difficulty: difficulty });
    if (error) throw toAppError(error);
    return data;
  },
  async findOwned(id: string, userId: string) {
    const { data, error } = await serviceRoleClient.from('game_sessions').select(cols).eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) throw toAppError(error);
    return data;
  },
  async findActive(userId: string) {
    const { data, error } = await serviceRoleClient.from('game_sessions').select(cols).eq('user_id', userId)
      .in('status', ['READY', 'INVESTIGATING', 'INTERROGATING', 'DEDUCTION']).order('started_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw toAppError(error);
    return data;
  },
  async states(id: string) {
    const { data, error } = await serviceRoleClient.from('session_suspect_states').select('suspect_id, current_emotion, questions_used').eq('session_id', id);
    if (error) throw toAppError(error);
    return data ?? [];
  },
  async difficulty(configId: string) {
    const { data, error } = await serviceRoleClient.schema('game_content').from('episode_difficulty_configs')
      .select('difficulty').eq('id', configId).maybeSingle();
    if (error) throw toAppError(error);
    return data?.difficulty ?? 'normal';
  },
  async evidence(id: string) {
    const { data, error } = await serviceRoleClient.from('session_evidence').select('evidence_id').eq('session_id', id).not('viewed_at', 'is', null);
    if (error) throw toAppError(error);
    return (data ?? []).map((row) => row.evidence_id);
  },
  async clueCount(id: string) {
    const { count, error } = await serviceRoleClient.from('session_clues').select('id', { count: 'exact', head: true }).eq('session_id', id);
    if (error) throw toAppError(error);
    return count ?? 0;
  },
  async suspectBelongs(episodeId: string, suspectId: string) {
    const { data, error } = await serviceRoleClient.schema('game_content').from('suspects').select('id').eq('id', suspectId).eq('episode_id', episodeId).maybeSingle();
    if (error) throw toAppError(error);
    return Boolean(data);
  },
  async transition(id: string, userId: string, status: string, currentSuspectId?: string | null, allowedStatuses?: string[]) {
    const changes: { status: string; current_suspect_id?: string | null } = { status };
    if (currentSuspectId !== undefined) changes.current_suspect_id = currentSuspectId;
    let query = serviceRoleClient.from('game_sessions').update(changes).eq('id', id).eq('user_id', userId);
    if (allowedStatuses?.length) query = query.in('status', allowedStatuses);
    const { data, error } = await query.select(cols).maybeSingle();
    if (error) throw toAppError(error);
    return data;
  }
};
