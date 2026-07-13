import type { Region } from './region.types.js';
import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { Row } from '../../shared/types/database.types.js';

export const regionRepository = {
  async findAll(): Promise<Region[]> {
    const { data, error } = await serviceRoleClient.schema('game_content').from('regions').select('id, name').order('sort_order');
    if (error) throw toAppError(error, 'Failed to load regions');
    return (data as Pick<Row<'game_content', 'regions'>, 'id' | 'name'>[]).map((row) => ({ id: row.id, name: row.name }));
  }
};
