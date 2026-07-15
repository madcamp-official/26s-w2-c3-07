import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { Json } from '../../shared/types/database.types.js';
import type { PublicProfile, SuspectRecord } from './suspect.types.js';

const content = serviceRoleClient.schema('game_content');
const columns = 'id, episode_id, code, name, age, occupation, public_profile, victim_relation, display_order, image_url';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const filterProfile = (value: Json): PublicProfile => {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {};
  return typeof value.summary === 'string' ? { summary: value.summary } : {};
};
const map = (row: Record<string, unknown>): SuspectRecord => ({
  id: String(row.id), episodeId: String(row.episode_id), code: String(row.code), name: String(row.name), age: row.age as number | null,
  occupation: row.occupation as string | null, publicProfile: filterProfile(row.public_profile as Json),
  victimRelation: row.victim_relation as string | null, displayOrder: Number(row.display_order), imageUrl: row.image_url as string | null
});

export const suspectRepository = {
  async episodeExists(episodeId: string) { const { data, error } = await content.from('episodes').select('id').eq('id', episodeId).eq('status', 'published').maybeSingle(); if (error) throw toAppError(error); return Boolean(data); },
  async findByEpisode(episodeId: string) { const { data, error } = await content.from('suspects').select(columns).eq('episode_id', episodeId).eq('is_active', true).order('display_order'); if (error) throw toAppError(error); return (data as unknown as Record<string, unknown>[]).map(map); },
  async findByKey(suspectKey: string, episodeId: string) { const query = content.from('suspects').select(columns).eq('episode_id', episodeId).eq('is_active', true); const filter = uuidPattern.test(suspectKey) ? query.eq('id', suspectKey) : query.eq('code', suspectKey.toUpperCase()); const { data, error } = await filter.maybeSingle(); if (error) throw toAppError(error); return data ? map(data as unknown as Record<string, unknown>) : null; },
  async findById(suspectId: string) { const { data, error } = await content.from('suspects').select(columns).eq('id', suspectId).maybeSingle(); if (error) throw toAppError(error); return data ? map(data as unknown as Record<string, unknown>) : null; }
};
