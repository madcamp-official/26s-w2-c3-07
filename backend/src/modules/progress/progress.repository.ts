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

function resolution(value: Json | string): HistoryItem['resolutionType'] {
  const type = typeof value === 'string' ? value : object(value).resolutionType;
  return type === 'FULL_RESOLUTION' || type === 'CULPRIT_CORRECT' || type === 'WRONG_SUSPECT' ? type : 'WRONG_SUSPECT';
}

function state(value: string | undefined): ProgressState {
  if (!value) return 'NOT_STARTED';
  return value.toLowerCase() === 'completed' ? 'COMPLETED' : 'IN_PROGRESS';
}

export const progressRepository = {
  async listEpisodes(userId: string): Promise<EpisodeProgressDto[]> {
    const { data: regions, error: regionError } = await content.from('regions')
      .select('id, code, name, display_order').eq('is_active', true).order('display_order');
    fail(regionError);
    if (!regions?.length) return [];
    const { data: episodes, error: episodeError } = await content.from('episodes')
      .select('id, region_id, code, title, display_order').eq('status', 'published')
      .in('region_id', regions.map((region) => region.id)).order('display_order');
    fail(episodeError);
    if (!episodes?.length) return [];
    const { data: rows, error: progressError } = await serviceRoleClient.from('user_episode_progress')
      .select('episode_id, state, best_difficulty, best_score, first_cleared_at, last_played_at, unlocked_at')
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
        state: state(row?.state),
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
      .select('id, episode_id, difficulty_config_id, started_at, completed_at', { count: 'exact' })
      .eq('user_id', userId).eq('status', 'COMPLETED').order('completed_at', { ascending: false }).range(from, from + pageSize - 1);
    fail(sessionError);
    const total = count ?? 0;
    if (!sessions?.length) return { items: [], page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
    const sessionIds = sessions.map((session) => session.id);
    const difficultyConfigIds = [...new Set(sessions.map((session) => session.difficulty_config_id))];
    const { data: difficultyConfigs, error: difficultyError } = await content.from('episode_difficulty_configs')
      .select('id, difficulty').in('id', difficultyConfigIds);
    fail(difficultyError);
    const difficultyByConfig = new Map((difficultyConfigs ?? []).map((config) => [config.id, config.difficulty]));
    const { data: results, error: resultError } = await serviceRoleClient.from('game_results')
      .select('session_id, selected_suspect_id, is_correct, score, resolution_type').in('session_id', sessionIds);
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
        difficulty: difficultyByConfig.get(session.difficulty_config_id) ?? 'normal',
        selectedSuspect: { id: suspect.id, code: suspect.code, name: suspect.name },
        isCorrect: result.is_correct,
        resolutionType: resolution(result.resolution_type),
        score: result.score ?? 0,
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
      .select('id, episode_id, expression, standard_meaning, usage_context')
      .in('id', unlocks.map((unlock) => unlock.dialect_expression_id));
    fail(expressionError);
    const episodeIds = [...new Set((expressions ?? []).map((expression) => expression.episode_id).filter((id): id is string => Boolean(id)))];
    const { data: episodes, error: episodeError } = episodeIds.length
      ? await content.from('episodes').select('id, region_id, code, title').in('id', episodeIds)
      : { data: [], error: null };
    fail(episodeError);
    const regionIds = [...new Set((episodes ?? []).map((episode) => episode.region_id))];
    const { data: regions, error: regionError } = regionIds.length
      ? await content.from('regions').select('id, code, name').in('id', regionIds)
      : { data: [], error: null };
    fail(regionError);
    const expressionById = new Map((expressions ?? []).map((expression) => [expression.id, expression]));
    const regionById = new Map((regions ?? []).map((region) => [region.id, region]));
    const episodeById = new Map((episodes ?? []).map((episode) => [episode.id, episode]));
    return unlocks.flatMap((unlock) => {
      const expression = expressionById.get(unlock.dialect_expression_id);
      const episode = expression ? episodeById.get(expression.episode_id) : undefined;
      const region = episode ? regionById.get(episode.region_id) : undefined;
      if (!expression || !episode || !region) return [];
      return [{
        expression: expression.expression,
        standardMeaning: expression.standard_meaning,
        usageContext: expression.usage_context,
        region: { id: region.id, code: region.code, name: region.name },
        episode: { id: episode.id, code: episode.code, title: episode.title },
        unlockedAt: unlock.unlocked_at
      }];
    });
  },

  async resultStats(userId: string): Promise<ResultStats> {
    const { data: sessions, error: sessionError } = await serviceRoleClient.from('game_sessions')
      .select('id, episode_id, completed_at').eq('user_id', userId).eq('status', 'COMPLETED').order('completed_at', { ascending: false });
    fail(sessionError);
    if (!sessions?.length) return { correctCount: 0, fullResolutionCount: 0, completedEpisodeIds: [], solvedEpisodeIds: [], currentStreak: 0 };
    const { data: results, error: resultError } = await serviceRoleClient.from('game_results')
      .select('session_id, is_correct, resolution_type').in('session_id', sessions.map((session) => session.id));
    fail(resultError);
    const episodeBySession = new Map(sessions.map((session) => [session.id, session.episode_id]));
    const resultBySession = new Map((results ?? []).map((result) => [result.session_id, result]));
    let currentStreak = 0;
    for (const session of sessions) {
      const result = resultBySession.get(session.id);
      if (!result?.is_correct) break;
      currentStreak += 1;
    }
    return {
      correctCount: (results ?? []).filter((result) => result.is_correct).length,
      fullResolutionCount: (results ?? []).filter((result) => result.resolution_type === 'FULL_RESOLUTION').length,
      completedEpisodeIds: [...new Set(sessions.map((session) => session.episode_id))],
      solvedEpisodeIds: [...new Set((results ?? []).filter((result) => result.is_correct).map((result) => episodeBySession.get(result.session_id)).filter((id): id is string => Boolean(id)))],
      currentStreak
    };
  },

  async countDialects(userId: string): Promise<number> {
    const { count, error } = await serviceRoleClient.from('user_dialect_unlocks')
      .select('id', { count: 'exact', head: true }).eq('user_id', userId);
    fail(error);
    return count ?? 0;
  }
};
