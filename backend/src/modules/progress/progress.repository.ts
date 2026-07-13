import { serviceRoleClient } from '../../config/supabase.js';
import type { Json } from '../../shared/types/database.types.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { DialectProgressDto, EpisodeProgressDto, HistoryItem, HistoryPage, ProgressState, RegionRef, ResultStats } from './progress.types.js';

const content = serviceRoleClient.schema('game_content');

function fail(error: { code?: string; message: string } | null): void {
  if (error) throw toAppError({ code: error.code ?? 'DATABASE_ERROR', message: error.message });
}

function object(value: Json): Record<string, Json | undefined> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function resolution(value: Json): HistoryItem['resolutionType'] {
  const type = object(value).resolutionType;
  return type === 'FULL_RESOLUTION' || type === 'CULPRIT_CORRECT' || type === 'WRONG_SUSPECT' ? type : 'WRONG_SUSPECT';
}

function state(value: string | undefined): ProgressState {
  if (!value) return 'NOT_STARTED';
  return value.toLowerCase() === 'completed' ? 'COMPLETED' : 'IN_PROGRESS';
}

export const progressRepository = {
  async listEpisodes(userId: string): Promise<EpisodeProgressDto[]> {
    const { data: regions, error: regionError } = await content.from('regions')
      .select('id, code, name, sort_order').eq('is_active', true).order('sort_order');
    fail(regionError);
    if (!regions?.length) return [];
    const { data: episodes, error: episodeError } = await content.from('episodes')
      .select('id, region_id, code, title, sort_order').eq('is_published', true).eq('status', 'available')
      .in('region_id', regions.map((region) => region.id)).order('sort_order');
    fail(episodeError);
    if (!episodes?.length) return [];
    const { data: rows, error: progressError } = await serviceRoleClient.from('user_episode_progress')
      .select('episode_id, status, best_difficulty, best_score, first_cleared_at, last_played_at, unlocked_at')
      .eq('user_id', userId).in('episode_id', episodes.map((episode) => episode.id));
    fail(progressError);
    const regionById = new Map(regions.map((region) => [region.id, { id: region.id, code: region.code, name: region.name }]));
    const progressByEpisode = new Map((rows ?? []).map((row) => [row.episode_id, row]));
    return episodes.map((episode) => {
      const row = progressByEpisode.get(episode.id);
      return {
        episodeId: episode.id,
        episodeCode: episode.code,
        title: episode.title,
        region: regionById.get(episode.region_id)!,
        state: state(row?.status),
        bestDifficulty: row?.best_difficulty ?? null,
        bestScore: row?.best_score ?? null,
        firstClearedAt: row?.first_cleared_at ?? null,
        lastPlayedAt: row?.last_played_at ?? null,
        unlockedAt: row?.unlocked_at ?? null
      };
    });
  },

  async history(userId: string, page: number, pageSize: number): Promise<HistoryPage> {
    const from = (page - 1) * pageSize;
    const { data: sessions, error: sessionError, count } = await serviceRoleClient.from('game_sessions')
      .select('id, episode_id, difficulty, started_at, completed_at', { count: 'exact' })
      .eq('user_id', userId).eq('status', 'COMPLETED').order('completed_at', { ascending: false }).range(from, from + pageSize - 1);
    fail(sessionError);
    const total = count ?? 0;
    if (!sessions?.length) return { items: [], page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
    const sessionIds = sessions.map((session) => session.id);
    const { data: results, error: resultError } = await serviceRoleClient.from('game_results')
      .select('session_id, selected_suspect_id, is_correct, score, result_data').in('session_id', sessionIds);
    fail(resultError);
    const episodeIds = [...new Set(sessions.map((session) => session.episode_id))];
    const suspectIds = [...new Set((results ?? []).map((result) => result.selected_suspect_id))];
    const [{ data: episodes, error: episodeError }, { data: suspects, error: suspectError }] = await Promise.all([
      content.from('episodes').select('id, region_id, code, title').in('id', episodeIds),
      suspectIds.length ? content.from('suspects').select('id, code, name').in('id', suspectIds) : Promise.resolve({ data: [], error: null })
    ]);
    fail(episodeError); fail(suspectError);
    const regionIds = [...new Set((episodes ?? []).map((episode) => episode.region_id))];
    const { data: regions, error: regionError } = regionIds.length
      ? await content.from('regions').select('id, code, name').in('id', regionIds)
      : { data: [], error: null };
    fail(regionError);
    const resultBySession = new Map((results ?? []).map((result) => [result.session_id, result]));
    const episodeById = new Map((episodes ?? []).map((episode) => [episode.id, episode]));
    const suspectById = new Map((suspects ?? []).map((suspect) => [suspect.id, suspect]));
    const regionById = new Map((regions ?? []).map((region) => [region.id, region]));
    const items: HistoryItem[] = sessions.flatMap((session) => {
      const result = resultBySession.get(session.id);
      const episode = episodeById.get(session.episode_id);
      const suspect = result ? suspectById.get(result.selected_suspect_id) : undefined;
      const region = episode ? regionById.get(episode.region_id) : undefined;
      if (!result || !episode || !suspect || !region || !session.completed_at) return [];
      return [{
        sessionId: session.id,
        episode: { id: episode.id, code: episode.code, title: episode.title, region: { id: region.id, code: region.code, name: region.name } },
        difficulty: session.difficulty,
        selectedSuspect: { id: suspect.id, code: suspect.code, name: suspect.name },
        isCorrect: result.is_correct,
        resolutionType: resolution(result.result_data),
        score: result.score,
        startedAt: session.started_at,
        completedAt: session.completed_at
      }];
    });
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  },

  async dialects(userId: string): Promise<DialectProgressDto[]> {
    const { data: unlocks, error: unlockError } = await serviceRoleClient.from('user_dialect_unlocks')
      .select('dialect_expression_id, unlocked_at').eq('user_id', userId).order('unlocked_at', { ascending: false });
    fail(unlockError);
    if (!unlocks?.length) return [];
    const { data: expressions, error: expressionError } = await content.from('dialect_expressions')
      .select('id, region_id, episode_id, dialect_text, standard_text, meaning, usage_context')
      .in('id', unlocks.map((unlock) => unlock.dialect_expression_id));
    fail(expressionError);
    const regionIds = [...new Set((expressions ?? []).map((expression) => expression.region_id))];
    const episodeIds = [...new Set((expressions ?? []).map((expression) => expression.episode_id).filter((id): id is string => Boolean(id)))];
    const [{ data: regions, error: regionError }, { data: episodes, error: episodeError }] = await Promise.all([
      content.from('regions').select('id, code, name').in('id', regionIds),
      episodeIds.length ? content.from('episodes').select('id, code, title').in('id', episodeIds) : Promise.resolve({ data: [], error: null })
    ]);
    fail(regionError); fail(episodeError);
    const expressionById = new Map((expressions ?? []).map((expression) => [expression.id, expression]));
    const regionById = new Map((regions ?? []).map((region) => [region.id, region]));
    const episodeById = new Map((episodes ?? []).map((episode) => [episode.id, episode]));
    return unlocks.flatMap((unlock) => {
      const expression = expressionById.get(unlock.dialect_expression_id);
      const region = expression ? regionById.get(expression.region_id) : undefined;
      if (!expression || !region) return [];
      const episode = expression.episode_id ? episodeById.get(expression.episode_id) : undefined;
      return [{
        expression: expression.dialect_text,
        standardMeaning: expression.meaning ?? expression.standard_text,
        usageContext: expression.usage_context,
        region: { id: region.id, code: region.code, name: region.name },
        episode: episode ? { id: episode.id, code: episode.code, title: episode.title } : null,
        unlockedAt: unlock.unlocked_at
      }];
    });
  },

  async resultStats(userId: string): Promise<ResultStats> {
    const { data: sessions, error: sessionError } = await serviceRoleClient.from('game_sessions')
      .select('id, episode_id').eq('user_id', userId).eq('status', 'COMPLETED');
    fail(sessionError);
    if (!sessions?.length) return { correctCount: 0, fullResolutionCount: 0, completedEpisodeIds: [], solvedEpisodeIds: [] };
    const { data: results, error: resultError } = await serviceRoleClient.from('game_results')
      .select('session_id, is_correct, result_data').in('session_id', sessions.map((session) => session.id));
    fail(resultError);
    const episodeBySession = new Map(sessions.map((session) => [session.id, session.episode_id]));
    return {
      correctCount: (results ?? []).filter((result) => result.is_correct).length,
      fullResolutionCount: (results ?? []).filter((result) => object(result.result_data).resolutionType === 'FULL_RESOLUTION').length,
      completedEpisodeIds: [...new Set(sessions.map((session) => session.episode_id))],
      solvedEpisodeIds: [...new Set((results ?? []).filter((result) => result.is_correct).map((result) => episodeBySession.get(result.session_id)).filter((id): id is string => Boolean(id)))]
    };
  },

  async countDialects(userId: string): Promise<number> {
    const { count, error } = await serviceRoleClient.from('user_dialect_unlocks')
      .select('id', { count: 'exact', head: true }).eq('user_id', userId);
    fail(error);
    return count ?? 0;
  }
};
