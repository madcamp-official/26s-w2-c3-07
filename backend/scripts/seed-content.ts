import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { serviceRoleClient } from '../src/config/supabase.js';
import { episodeCodes, loadContentDocuments, runContentSeed, type ContentSeedWriter, type ContentTable, type SeedRow } from '../src/seeds/content-seed.js';
import { fourEpisodeContent } from '../src/seeds/four-episode-content.js';

const contentDirectory = resolve(fileURLToPath(new URL('../supabase/seed/content', import.meta.url)));
const contentClient = serviceRoleClient.schema('game_content');

const writer: ContentSeedWriter = {
  async upsert(table: ContentTable, rows: SeedRow[], conflictKey: 'code' | 'id') {
    if (rows.length === 0) return { inserted: 0, updated: 0 };
    const keys = rows.map((row) => row[conflictKey]).filter((value): value is string => typeof value === 'string');
    const { data: existing, error: selectError } = await contentClient.from(table).select(conflictKey).in(conflictKey, keys);
    if (selectError) throw selectError;
    const existingKeys = new Set((existing as unknown as SeedRow[]).map((row) => row[conflictKey]));
    const { error } = await contentClient.from(table).upsert(rows as never, { onConflict: conflictKey });
    if (error) throw error;
    return { inserted: keys.filter((key) => !existingKeys.has(key)).length, updated: keys.filter((key) => existingKeys.has(key)).length };
  },
  async updateEpisodeCulprit(episodeId: string, suspectId: string) {
    const { error } = await contentClient.from('episodes').update({ culprit_suspect_id: suspectId }).eq('id', episodeId);
    if (error) throw error;
    return { inserted: 0, updated: 1 };
  }
};

const loaded = await loadContentDocuments(contentDirectory);
const tables = loaded.episodes.length > 0 ? loaded : fourEpisodeContent();
const result = await runContentSeed(tables, writer);
console.log(`Content seed: inserted=${result.inserted}, updated=${result.updated}`);
if (result.validationErrors.length > 0) {
  console.error('Content validation failed:');
  for (const error of result.validationErrors) console.error(`- ${error}`);
  console.error(`Required specifications: ${episodeCodes.join(', ')}`);
  process.exitCode = 1;
}
