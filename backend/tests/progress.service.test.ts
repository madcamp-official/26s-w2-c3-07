import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { progressRepository as repository } from '../src/modules/progress/progress.repository.js';
import { parseHistoryQuery, progressService } from '../src/modules/progress/progress.service.js';
import type { DialectProgressDto, EpisodeProgressDto, HistoryItem } from '../src/modules/progress/progress.types.js';

const userId = '00000000-0000-4000-8000-000000000001';
const region = { id: '00000000-0000-4000-8000-000000000002', code: 'GS', name: '경상도' };
const episode: EpisodeProgressDto = {
  episodeId: '00000000-0000-4000-8000-000000000003', episodeCode: 'GS-01', title: '종가의 밤', region,
  state: 'COMPLETED', bestDifficulty: 'hard', bestScore: 90,
  firstClearedAt: '2026-07-12T10:00:00.000Z', lastPlayedAt: '2026-07-13T10:00:00.000Z', unlockedAt: '2026-07-11T10:00:00.000Z'
};
const historyItem: HistoryItem = {
  sessionId: '00000000-0000-4000-8000-000000000004',
  episode: { id: episode.episodeId, code: episode.episodeCode, title: episode.title, region },
  difficulty: 'hard',
  selectedSuspect: { id: '00000000-0000-4000-8000-000000000005', code: 'GS-01-S1', name: '이순임' },
  isCorrect: true, resolutionType: 'FULL_RESOLUTION', score: 90,
  startedAt: '2026-07-13T09:00:00.000Z', completedAt: '2026-07-13T10:00:00.000Z'
};
const dialect: DialectProgressDto = {
  expression: '마', standardMeaning: '그만하세요', usageContext: '제지', region,
  episode: { id: episode.episodeId, code: episode.episodeCode, title: episode.title },
  unlockedAt: '2026-07-13T10:00:00.000Z'
};

beforeEach(() => {
  vi.spyOn(repository, 'listEpisodes').mockResolvedValue([]);
  vi.spyOn(repository, 'history').mockResolvedValue({ items: [], page: 1, pageSize: 5, total: 0, totalPages: 0 });
  vi.spyOn(repository, 'resultStats').mockResolvedValue({ correctCount: 0, fullResolutionCount: 0, completedEpisodeIds: [], solvedEpisodeIds: [], currentStreak: 0 });
  vi.spyOn(repository, 'countDialects').mockResolvedValue(0);
  vi.spyOn(repository, 'dialects').mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe('progress summary and episodes', () => {
  it('returns an empty progress summary', async () => {
    await expect(progressService.summary(userId)).resolves.toEqual({
      playedEpisodeCount: 0, completedEpisodeCount: 0, solvedEpisodeCount: 0, unresolvedEpisodeCount: 4, currentStreak: 0, correctCount: 0, fullResolutionCount: 0,
      regionProgress: [], recentPlays: [], unlockedDialectCount: 0
    });
  });

  it('aggregates completed records and regional progress', async () => {
    vi.mocked(repository.listEpisodes).mockResolvedValue([episode]);
    vi.mocked(repository.history).mockResolvedValue({ items: [historyItem], page: 1, pageSize: 5, total: 1, totalPages: 1 });
    vi.mocked(repository.resultStats).mockResolvedValue({ correctCount: 1, fullResolutionCount: 1, completedEpisodeIds: [episode.episodeId], solvedEpisodeIds: [episode.episodeId], currentStreak: 1 });
    vi.mocked(repository.countDialects).mockResolvedValue(1);
    await expect(progressService.summary(userId)).resolves.toMatchObject({
      playedEpisodeCount: 1, completedEpisodeCount: 1, solvedEpisodeCount: 1, correctCount: 1, fullResolutionCount: 1,
      regionProgress: [{ region, totalEpisodes: 1, playedEpisodes: 1, solvedEpisodes: 1 }],
      recentPlays: [historyItem], unlockedDialectCount: 1
    });
  });
  it('does not count a wrong completed episode as solved', async () => {
    vi.mocked(repository.listEpisodes).mockResolvedValue([episode]);
    vi.mocked(repository.resultStats).mockResolvedValue({ correctCount: 0, fullResolutionCount: 0, completedEpisodeIds: [episode.episodeId], solvedEpisodeIds: [], currentStreak: 0 });
    await expect(progressService.summary(userId)).resolves.toMatchObject({ completedEpisodeCount: 1, solvedEpisodeCount: 0, regionProgress: [{ solvedEpisodes: 0 }] });
  });
  it('deduplicates repeated correct results by episode', async () => {
    vi.mocked(repository.listEpisodes).mockResolvedValue([episode]);
    vi.mocked(repository.resultStats).mockResolvedValue({ correctCount: 2, fullResolutionCount: 1, completedEpisodeIds: [episode.episodeId], solvedEpisodeIds: [episode.episodeId], currentStreak: 2 });
    await expect(progressService.summary(userId)).resolves.toMatchObject({ correctCount: 2, solvedEpisodeCount: 1 });
  });

  it('returns episode progress fields without inventing sequential unlocks', async () => {
    vi.mocked(repository.listEpisodes).mockResolvedValue([episode]);
    await expect(progressService.episodes(userId)).resolves.toEqual([episode]);
  });
});

describe('history pagination and dialect unlocks', () => {
  it('applies pagination and returns total metadata', async () => {
    vi.mocked(repository.history).mockResolvedValue({ items: [historyItem], page: 2, pageSize: 10, total: 14, totalPages: 2 });
    await expect(progressService.history(userId, { page: '2', pageSize: '10' })).resolves.toMatchObject({ page: 2, pageSize: 10, total: 14, totalPages: 2 });
    expect(repository.history).toHaveBeenCalledWith(userId, 2, 10);
    expect(() => parseHistoryQuery({ page: 0 })).toThrow();
    expect(() => parseHistoryQuery({ pageSize: 101 })).toThrow();
  });

  it('returns only stored dialect unlock records with their timestamps', async () => {
    vi.mocked(repository.dialects).mockResolvedValue([dialect]);
    await expect(progressService.dialects(userId)).resolves.toEqual([dialect]);
  });

  it('always scopes repository reads to the authenticated user id', async () => {
    await progressService.summary(userId);
    expect(repository.listEpisodes).toHaveBeenCalledWith(userId);
    expect(repository.resultStats).toHaveBeenCalledWith(userId);
    expect(repository.countDialects).toHaveBeenCalledWith(userId);
  });
});

describe('database progress invariants', () => {
  const migration = readFileSync(new URL('../supabase/migrations/20260713052002_add_progress_and_history.sql', import.meta.url), 'utf8');
  const route = readFileSync(new URL('../src/modules/progress/progress.route.ts', import.meta.url), 'utf8');
  const repositorySource = readFileSync(new URL('../src/modules/progress/progress.repository.ts', import.meta.url), 'utf8');
  const seedSource = readFileSync(new URL('../src/seeds/content-seed.ts', import.meta.url), 'utf8');

  it('updates best score only when the new score is higher', () => {
    expect(migration).toContain('excluded.best_score > public.user_episode_progress.best_score');
    expect(migration).toContain('else public.user_episode_progress.best_score');
  });

  it('preserves firstClearedAt and updates lastPlayedAt on every completion', () => {
    expect(migration).toContain('first_cleared_at = coalesce(public.user_episode_progress.first_cleared_at, excluded.first_cleared_at)');
    expect(migration).toContain('last_played_at = excluded.last_played_at');
    expect(migration).toContain("new.status = 'COMPLETED'");
  });

  it('provides read-only routes and explicit authenticated-user filters', () => {
    expect(route).toContain('requireAuth');
    expect(route).not.toContain('.post(');
    expect(route).not.toContain('.patch(');
    expect(repositorySource).toContain(".eq('user_id', userId)");
  });

  it('persists the seed episode reference and uses only stored dialect unlocks', () => {
    expect(seedSource).toContain('stored.episode_id = row._episode_id');
    expect(repositorySource).toContain("from('user_dialect_unlocks')");
    expect(repositorySource).not.toContain('unlockStrategy');
  });
});
