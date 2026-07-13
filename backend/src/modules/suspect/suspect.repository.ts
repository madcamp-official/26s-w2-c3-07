import { serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { Json } from '../../shared/types/database.types.js';
import type { PublicProfile, SuspectRecord } from './suspect.types.js';

const content = serviceRoleClient.schema('game_content');
const columns = 'id, episode_id, code, name, age, occupation, public_profile, public_personality, victim_relation, initial_emotion, sort_order, image_url';
const filterProfile = (value: Json): PublicProfile => {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {};
  return typeof value.summary === 'string' ? { summary: value.summary } : {};
};
const map = (row: Record<string, unknown>): SuspectRecord => ({
  id: String(row.id), episodeId: String(row.episode_id), code: String(row.code), name: String(row.name), age: row.age as number | null,
  occupation: row.occupation as string | null, publicProfile: filterProfile(row.public_profile as Json), personality: row.public_personality as string | null,
  victimRelation: row.victim_relation as string | null, initialEmotion: String(row.initial_emotion), displayOrder: Number(row.sort_order), imageUrl: row.image_url as string | null
});

export const suspectRepository = {
  async episodeExists(episodeId: string) { const { data, error } = await content.from('episodes').select('id').eq('id', episodeId).eq('is_published', true).eq('status', 'available').maybeSingle(); if (error) throw toAppError(error); return Boolean(data); },
  async findByEpisode(episodeId: string) { const { data, error } = await content.from('suspects').select(columns).eq('episode_id', episodeId).order('sort_order'); if (error) throw toAppError(error); return (data as unknown as Record<string, unknown>[]).map(map); },
  async findById(suspectId: string) { const { data, error } = await content.from('suspects').select(columns).eq('id', suspectId).maybeSingle(); if (error) throw toAppError(error); return data ? map(data as unknown as Record<string, unknown>) : null; }
};
