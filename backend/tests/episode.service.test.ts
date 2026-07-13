import { afterEach, describe, expect, it, vi } from 'vitest';
import { episodeRepository } from '../src/modules/episode/episode.repository.js';
import { episodeService } from '../src/modules/episode/episode.service.js';

const summary = { id: 'episode-1', code: 'GS-01', title: '종가의 밤', location: '경상도', incidentType: '살인 사건', synopsis: '공개 줄거리', estimatedPlayMinutes: 15, status: 'available', imageUrl: null, progressStatus: null };
const victim = { name: '김재현', age: 68, occupation: '대주', profile: { description: '공개 정보' } };
const difficulties = [{ difficulty: 'hard', questionsPerSuspect: 1, totalQuestions: 4, timeLimitSeconds: 600, dialectLevel: 'native', hintLimit: 0 }];

afterEach(() => vi.restoreAllMocks());

describe('episode service', () => {
  it('filters the list by the repository region query and adds user progress', async () => {
    const list = vi.spyOn(episodeRepository, 'findByRegion').mockResolvedValue([summary]);
    vi.spyOn(episodeRepository, 'findProgress').mockResolvedValue(new Map([['episode-1', 'completed']]));
    await expect(episodeService.listByRegion('region-1', 'user-1')).resolves.toEqual([expect.objectContaining({ progressStatus: 'completed' })]);
    expect(list).toHaveBeenCalledWith('region-1');
  });
  it('returns only public episode detail fields', async () => {
    vi.spyOn(episodeRepository, 'findById').mockResolvedValue({ ...summary, sceneDescription: '공개 내레이션' });
    vi.spyOn(episodeRepository, 'findVictim').mockResolvedValue(victim);
    vi.spyOn(episodeRepository, 'findDifficulties').mockResolvedValue(difficulties);
    const result = await episodeService.detail('episode-1');
    expect(result).not.toHaveProperty('culprit_suspect_id');
    expect(result).not.toHaveProperty('server_truth');
    expect(result).not.toHaveProperty('sceneDescription');
    expect(result).toMatchObject({ code: 'GS-01', victim });
  });
  it('returns only PUBLIC_INITIAL timeline and initial evidence supplied by the repository boundary', async () => {
    vi.spyOn(episodeRepository, 'findById').mockResolvedValue({ ...summary, sceneDescription: '공개 내레이션' });
    vi.spyOn(episodeRepository, 'findVictim').mockResolvedValue(victim);
    vi.spyOn(episodeRepository, 'findSceneParts').mockResolvedValue({ timeline: [{ occurredAt: '사건 발견', title: '발견', description: '공개' }], evidence: [{ id: 'e1', code: 'GS-01-E1', title: '식혜', description: '공개 증거', evidenceType: 'physical' }] });
    const scene = await episodeService.scene('episode-1');
    expect(scene.timeline).toHaveLength(1);
    expect(scene.evidence).toHaveLength(1);
    expect(JSON.stringify(scene)).not.toContain('PRIVATE');
  });
  it('returns EPISODE_NOT_FOUND for unpublished or missing episodes', async () => {
    vi.spyOn(episodeRepository, 'findById').mockResolvedValue(null);
    await expect(episodeService.detail('missing')).rejects.toMatchObject({ code: 'EPISODE_NOT_FOUND' });
  });
  it('returns JJ-01 hard with six total questions from DB data', async () => {
    vi.spyOn(episodeRepository, 'findById').mockResolvedValue({ ...summary, code: 'JJ-01', sceneDescription: '공개' });
    vi.spyOn(episodeRepository, 'findDifficulties').mockResolvedValue([{ ...difficulties[0], totalQuestions: 6 }]);
    await expect(episodeService.difficulties('jj')).resolves.toEqual([expect.objectContaining({ difficulty: 'hard', totalQuestions: 6, questionsPerSuspect: 1 })]);
  });
});
