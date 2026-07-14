import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const query: Record<string, ReturnType<typeof vi.fn>> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.maybeSingle = vi.fn();
  return { query, from: vi.fn(() => query) };
});

vi.mock('../src/config/supabase.js', () => ({
  serviceRoleClient: {
    schema: vi.fn(() => ({ from: mocks.from })),
    from: vi.fn()
  }
}));
vi.mock('../src/shared/utils/supabase.js', () => ({ toAppError: (error: unknown) => error }));

import { episodeRepository } from '../src/modules/episode/episode.repository.js';

const row = { id: '00000001-0000-4000-8000-000000000002', code: 'GS-01', title: '종가의 밤', location: '경상도', incident_type: '살인 사건', synopsis: '공개 줄거리', estimated_play_minutes: 15, status: 'published', cover_image_url: null };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.query.select.mockImplementation(() => mocks.query);
  mocks.query.eq.mockImplementation(() => mocks.query);
  mocks.query.maybeSingle.mockResolvedValue({ data: row, error: null });
});

describe('episode repository findByKey', () => {
  it('queries UUID keys by id', async () => {
    const uuid = '00000001-0000-4000-8000-000000000002';
    await episodeRepository.findByKey(uuid);
    expect(mocks.query.eq).toHaveBeenCalledWith('id', uuid);
    expect(mocks.query.eq).not.toHaveBeenCalledWith('code', expect.anything());
  });

  it('queries uppercase codes by normalized code', async () => {
    await episodeRepository.findByKey('GS-01');
    expect(mocks.query.eq).toHaveBeenCalledWith('code', 'GS-01');
  });

  it('normalizes lowercase codes before querying', async () => {
    await episodeRepository.findByKey('gs-01');
    expect(mocks.query.eq).toHaveBeenCalledWith('code', 'GS-01');
  });
});
