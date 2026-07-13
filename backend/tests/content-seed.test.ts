import { describe, expect, it } from 'vitest';
import { episodeCodes, runContentSeed, tableOrder, validateContent, type ContentSeedWriter, type SeedRow, type SeedTables } from '../src/seeds/content-seed.js';
import { fourEpisodeContent } from '../src/seeds/four-episode-content.js';

const uuid = (value: number) => `00000000-0000-4000-8000-${value.toString().padStart(12, '0')}`;

const fixture = (): SeedTables => {
  const tables = Object.fromEntries(tableOrder.map((table) => [table, []])) as SeedTables;
  episodeCodes.forEach((code, episodeIndex) => {
    const episodeId = uuid(episodeIndex + 1);
    const suspectIds = [1, 2, 3, 4].map((offset) => uuid(100 + episodeIndex * 4 + offset));
    tables.episodes.push({ id: episodeId, code, region_id: uuid(900 + episodeIndex), title: code, _culprit_suspect_id: suspectIds[0] });
    tables.victims.push({ id: uuid(200 + episodeIndex), episode_id: episodeId, name: 'fixture' });
    suspectIds.forEach((id, index) => tables.suspects.push({ id, episode_id: episodeId, code: `${code}-S${index + 1}`, name: 'fixture' }));
    for (const difficulty of ['easy', 'normal', 'hard']) { const total = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 8 : code === 'JJ-01' ? 6 : 4; tables.episode_difficulty_configs.push({ id: uuid(300 + tables.episode_difficulty_configs.length), episode_id: episodeId, difficulty, questions_per_suspect: difficulty === 'easy' ? 3 : difficulty === 'normal' ? 2 : 1, total_questions: total }); }
    tables.clues.push({ id: uuid(500 + episodeIndex), episode_id: episodeId, code: `${code}-CORE`, title: 'fixture', clue_type: 'CORE' });
  });
  return tables;
};

class MemoryWriter implements ContentSeedWriter {
  rows = new Map<string, SeedRow>();
  async upsert(table: string, rows: SeedRow[], conflictKey: 'code' | 'id') {
    let inserted = 0; let updated = 0;
    for (const row of rows) {
      const key = `${table}:${String(row[conflictKey])}`;
      this.rows.has(key) ? updated++ : inserted++;
      this.rows.set(key, row);
    }
    return { inserted, updated };
  }
  async updateEpisodeCulprit() { return { inserted: 0, updated: 1 }; }
}

describe('content seed', () => {
  it('reports all missing specifications before writing', () => {
    const tables = Object.fromEntries(tableOrder.map((table) => [table, []])) as SeedTables;
    expect(validateContent(tables).errors).toEqual(episodeCodes.map((code) => `${code}: content specification is missing`));
  });
  it('validates the difficulty exception and episode invariants', () => expect(validateContent(fixture())).toEqual({ valid: true, errors: [] }));
  it('validates the four PDF-derived episode specifications', () => expect(validateContent(fourEpisodeContent())).toEqual({ valid: true, errors: [] }));
  it('does not increase row count on a second run', async () => {
    const writer = new MemoryWriter();
    const first = await runContentSeed(fixture(), writer);
    const rowCount = writer.rows.size;
    const second = await runContentSeed(fixture(), writer);
    expect(first.inserted).toBeGreaterThan(0);
    expect(second.inserted).toBe(0);
    expect(writer.rows.size).toBe(rowCount);
  });
  it('persists the dialect episode reference while stripping seed-only metadata', async () => {
    const tables = fixture();
    const episodeId = String(tables.episodes[0].id);
    tables.dialect_expressions.push({
      id: uuid(700), code: 'GS-D1', region_id: tables.episodes[0].region_id,
      _episode_id: episodeId, _related_clue_id: tables.clues[0].id,
      dialect_text: '마', standard_text: '그만'
    });
    const writer = new MemoryWriter();
    await runContentSeed(tables, writer);
    const stored = writer.rows.get('dialect_expressions:GS-D1');
    expect(stored?.episode_id).toBe(episodeId);
    expect(stored?._episode_id).toBeUndefined();
    expect(stored?._related_clue_id).toBeUndefined();
  });
});
