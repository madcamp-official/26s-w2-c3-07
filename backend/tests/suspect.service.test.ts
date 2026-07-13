import { afterEach, describe, expect, it, vi } from 'vitest';
import { suspectRepository } from '../src/modules/suspect/suspect.repository.js';
import { suspectService } from '../src/modules/suspect/suspect.service.js';
import type { SuspectRecord } from '../src/modules/suspect/suspect.types.js';

const suspect = (index = 1, episodeId = 'episode-1'): SuspectRecord => ({ id: `suspect-${index}`, episodeId, code: `GS-01-S${index}`, name: `용의자 ${index}`, age: 20 + index, occupation: '공개 직업', publicProfile: { summary: '공개 소개' }, personality: '공개 성격', victimRelation: '피해자와 공개 관계', initialEmotion: 'neutral', displayOrder: index, imageUrl: null });
afterEach(() => vi.restoreAllMocks());

describe('suspect service', () => {
  it('returns four suspects in display order', async () => { vi.spyOn(suspectRepository, 'episodeExists').mockResolvedValue(true); vi.spyOn(suspectRepository, 'findByEpisode').mockResolvedValue([suspect(4), suspect(2), suspect(1), suspect(3)]); const result = await suspectService.list('episode-1'); expect(result).toHaveLength(4); expect(result.map((item) => item.displayOrder)).toEqual([1,2,3,4]); });
  it('blocks a suspect from another episode', async () => { vi.spyOn(suspectRepository, 'episodeExists').mockResolvedValue(true); vi.spyOn(suspectRepository, 'findById').mockResolvedValue(suspect(1, 'episode-2')); await expect(suspectService.detail('episode-1', 'suspect-1')).rejects.toMatchObject({ code: 'SUSPECT_NOT_IN_EPISODE' }); });
  it('does not expose routes, culprit, or private rule data', async () => { vi.spyOn(suspectRepository, 'episodeExists').mockResolvedValue(true); vi.spyOn(suspectRepository, 'findById').mockResolvedValue(suspect()); const result = await suspectService.detail('episode-1', 'suspect-1'); const json = JSON.stringify(result); expect(json).not.toContain('actualRoute'); expect(json).not.toContain('claimedRoute'); expect(json).not.toContain('is_culprit'); expect(json).not.toContain('suspect_facts'); expect(result).not.toHaveProperty('episodeId'); });
  it('returns SUSPECT_NOT_FOUND for a missing suspect', async () => { vi.spyOn(suspectRepository, 'episodeExists').mockResolvedValue(true); vi.spyOn(suspectRepository, 'findById').mockResolvedValue(null); await expect(suspectService.detail('episode-1', 'missing')).rejects.toMatchObject({ code: 'SUSPECT_NOT_FOUND' }); });
  it('returns EPISODE_NOT_FOUND for a missing episode', async () => { vi.spyOn(suspectRepository, 'episodeExists').mockResolvedValue(false); await expect(suspectService.list('missing')).rejects.toMatchObject({ code: 'EPISODE_NOT_FOUND' }); });
});
