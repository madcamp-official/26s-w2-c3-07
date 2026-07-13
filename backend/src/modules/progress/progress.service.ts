import { AppError } from '../../shared/errors/app-error.js';
import { progressRepository as repository } from './progress.repository.js';
import { historyQuerySchema } from './progress.schema.js';
import type { EpisodeProgressDto, ProgressSummary, RegionRef } from './progress.types.js';

export function parseHistoryQuery(query: unknown): { page: number; pageSize: number } {
  const parsed = historyQuerySchema.safeParse(query);
  if (!parsed.success) throw new AppError(400, 'Invalid history pagination', 'VALIDATION_ERROR');
  return parsed.data;
}

function regionSummary(episodes: EpisodeProgressDto[]): ProgressSummary['regionProgress'] {
  const grouped = new Map<string, { region: RegionRef; totalEpisodes: number; playedEpisodes: number; solvedEpisodes: number }>();
  for (const episode of episodes) {
    const current = grouped.get(episode.region.id) ?? { region: episode.region, totalEpisodes: 0, playedEpisodes: 0, solvedEpisodes: 0 };
    current.totalEpisodes += 1;
    if (episode.state !== 'NOT_STARTED') current.playedEpisodes += 1;
    if (episode.state === 'COMPLETED') current.solvedEpisodes += 1;
    grouped.set(episode.region.id, current);
  }
  return [...grouped.values()];
}

export const progressService = {
  async summary(userId: string): Promise<ProgressSummary> {
    const [episodes, history, stats, unlockedDialectCount] = await Promise.all([
      repository.listEpisodes(userId), repository.history(userId, 1, 5), repository.resultStats(userId), repository.countDialects(userId)
    ]);
    return {
      playedEpisodeCount: episodes.filter((episode) => episode.state !== 'NOT_STARTED').length,
      solvedEpisodeCount: episodes.filter((episode) => episode.state === 'COMPLETED').length,
      correctCount: stats.correctCount,
      fullResolutionCount: stats.fullResolutionCount,
      regionProgress: regionSummary(episodes),
      recentPlays: history.items,
      unlockedDialectCount
    };
  },

  episodes(userId: string) { return repository.listEpisodes(userId); },
  history(userId: string, query: unknown) { const { page, pageSize } = parseHistoryQuery(query); return repository.history(userId, page, pageSize); },
  dialects(userId: string) { return repository.dialects(userId); }
};
