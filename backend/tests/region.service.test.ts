import { describe, expect, it } from 'vitest';
import { createRegionService } from '../src/modules/region/region.service.js';
import { toAppError } from '../src/shared/utils/supabase.js';
import type { Region } from '../src/modules/region/region.types.js';

const region = (overrides: Partial<Region> = {}): Region => ({
  id: '00000000-0000-4000-8000-000000000001', code: 'GS', name: '경상도', description: null,
  imageUrl: null, displayOrder: 1, isActive: true, ...overrides
});

describe('region service', () => {
  it('returns active regions in display order', async () => {
    const service = createRegionService({
      findAll: async () => [region({ code: 'JJ', displayOrder: 4 }), region({ code: 'OFF', displayOrder: 0, isActive: false }), region({ code: 'GS', displayOrder: 1 })],
      findByIdOrCode: async () => null
    });
    await expect(service.listRegions()).resolves.toEqual([expect.objectContaining({ code: 'GS' }), expect.objectContaining({ code: 'JJ' })]);
  });
  it('returns details by repository identifier lookup', async () => {
    const service = createRegionService({ findAll: async () => [], findByIdOrCode: async (value) => value === 'GS' ? region() : null });
    await expect(service.getRegion('GS')).resolves.toMatchObject({ code: 'GS', displayOrder: 1 });
  });
  it('does not expose an inactive region', async () => {
    const service = createRegionService({ findAll: async () => [], findByIdOrCode: async () => region({ isActive: false }) });
    await expect(service.getRegion('OFF')).rejects.toMatchObject({ code: 'REGION_NOT_FOUND' });
  });
  it('returns REGION_NOT_FOUND for an unknown region', async () => {
    const service = createRegionService({ findAll: async () => [], findByIdOrCode: async () => null });
    await expect(service.getRegion('UNKNOWN')).rejects.toMatchObject({ statusCode: 404, code: 'REGION_NOT_FOUND' });
  });
  it('preserves converted database errors', async () => {
    const service = createRegionService({ findAll: async () => { throw toAppError({ code: '08006', message: 'connection failed' }); }, findByIdOrCode: async () => null });
    await expect(service.listRegions()).rejects.toMatchObject({ statusCode: 500, code: 'DB_08006' });
  });
});
