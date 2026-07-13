import type { Episode } from './episode.types.js';
import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { Row } from '../../shared/types/database.types.js';

export const episodeRepository = {
  async findAll(): Promise<Episode[]> {
    const { data, error } = await serviceRoleClient.schema('game_content').from('episodes').select('id, region_id, title');
    if (error) throw toAppError(error, 'Failed to load episodes');
    return (data as Pick<Row<'game_content', 'episodes'>, 'id' | 'region_id' | 'title'>[]).map((row) => ({
      id: row.id, regionId: row.region_id, title: row.title
    }));
  }
};
