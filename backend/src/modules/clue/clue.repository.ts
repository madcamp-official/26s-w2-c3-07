import type { Clue } from './clue.types.js';
import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { Row } from '../../shared/types/database.types.js';

export const clueRepository = {
  async findAll(): Promise<Clue[]> {
    const { data, error } = await serviceRoleClient.schema('game_content').from('clues').select('id, episode_id, title').order('sort_order');
    if (error) throw toAppError(error, 'Failed to load clues');
    return (data as Pick<Row<'game_content', 'clues'>, 'id' | 'episode_id' | 'title'>[]).map((row) => ({
      id: row.id, episodeId: row.episode_id, title: row.title
    }));
  }
};
