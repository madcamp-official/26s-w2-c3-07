import type { Region } from './region.types.js';
import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { Row } from '../../shared/types/database.types.js';

type RegionRow = Pick<Row<'game_content', 'regions'>, 'id' | 'code' | 'name' | 'description' | 'image_url' | 'sort_order' | 'is_active'>;
const columns = 'id, code, name, description, image_url, sort_order, is_active';
const toRegion = (row: RegionRow): Region => ({
  id: row.id, code: row.code, name: row.name, description: row.description,
  imageUrl: row.image_url, displayOrder: row.sort_order, isActive: row.is_active
});
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const regionRepository = {
  async findAll(): Promise<Region[]> {
    const { data, error } = await serviceRoleClient.schema('game_content').from('regions').select(columns).eq('is_active', true).order('sort_order', { ascending: true });
    if (error) throw toAppError(error, 'Failed to load regions');
    return (data as unknown as RegionRow[]).map(toRegion);
  },
  async findByIdOrCode(identifier: string): Promise<Region | null> {
    const key = uuidPattern.test(identifier) ? 'id' : 'code';
    const { data, error } = await serviceRoleClient.schema('game_content').from('regions').select(columns).eq(key, identifier).eq('is_active', true).maybeSingle();
    if (error) throw toAppError(error, 'Failed to load region');
    return data ? toRegion(data as unknown as RegionRow) : null;
  }
};
