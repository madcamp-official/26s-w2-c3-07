import type { Suspect } from './suspect.types.js';
import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { Row } from '../../shared/types/database.types.js';

export const suspectRepository = {
  async findAll(): Promise<Suspect[]> {
    const { data, error } = await serviceRoleClient.schema('game_content').from('suspects').select('id, episode_id, name').order('sort_order');
    if (error) throw toAppError(error, 'Failed to load suspects');
    return (data as Pick<Row<'game_content', 'suspects'>, 'id' | 'episode_id' | 'name'>[]).map((row) => ({
      id: row.id, episodeId: row.episode_id, name: row.name
    }));
  }
};
