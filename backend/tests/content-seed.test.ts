import { describe, expect, it } from 'vitest';
import { episodeCodes, migrationManagedTables, runContentSeed, tableOrder, validateContent, type ContentSeedWriter, type SeedRow, type SeedTables } from '../src/seeds/content-seed.js';
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
    const difficultyConfigIds: string[] = [];
    for (const difficulty of ['easy', 'normal', 'hard']) {
      const total = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 8 : code === 'JJ-01' ? 6 : 4;
      const difficultyConfigId = uuid(300 + tables.episode_difficulty_configs.length);
      difficultyConfigIds.push(difficultyConfigId);
      tables.episode_difficulty_configs.push({ id: difficultyConfigId, episode_id: episodeId, difficulty, questions_per_suspect: difficulty === 'easy' ? 3 : difficulty === 'normal' ? 2 : 1, total_questions: total });
    }
    const clueId = uuid(500 + episodeIndex);
    tables.clues.push({ id: clueId, episode_id: episodeId, code: `${code}-CORE`, title: 'fixture', importance: 'CORE' });
    const evidenceIds = [0, 1, 2].map((offset) => uuid(600 + episodeIndex * 3 + offset));
    evidenceIds.forEach((evidenceId, index) => tables.evidence.push({ id: evidenceId, episode_id: episodeId, code: `${code}-E${index + 1}`, title: 'fixture', initial_visible: false }));
    [3, 2, 1].forEach((count, difficultyIndex) => {
      evidenceIds.slice(0, count).forEach((evidenceId, displayIndex) => tables.difficulty_initial_evidence.push({
        id: uuid(800 + episodeIndex * 20 + difficultyIndex * 4 + displayIndex), difficulty_config_id: difficultyConfigIds[difficultyIndex], evidence_id: evidenceId, display_order: displayIndex + 1
      }));
    });
    tables.difficulty_initial_clues.push({ id: uuid(880 + episodeIndex), difficulty_config_id: difficultyConfigIds[0], clue_id: clueId, display_order: 1 });
    tables.clue_unlock_conditions.push({ id: uuid(650 + episodeIndex), clue_id: clueId, condition_type: 'EVIDENCE_VIEWED', target_ref: evidenceIds[0], group_no: 1, operator: 'EQ', _target_evidence_id: evidenceIds[0] });
  });
  return tables;
};

class MemoryWriter implements ContentSeedWriter {
  rows = new Map<string, SeedRow>();
  async upsert(table: string, rows: SeedRow[], conflictKey: 'code' | 'id') {
    let inserted = 0;
    let updated = 0;
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
  it('provides exactly 3, 2, and 1 initial evidence rows with one starting clue', () => {
    const tables = fourEpisodeContent();
    for (const episode of tables.episodes) {
      const configs = tables.episode_difficulty_configs.filter((row) => row.episode_id === episode.id);
      for (const [difficulty, expected] of [['easy', 3], ['normal', 2], ['hard', 1]] as const) {
        const config = configs.find((row) => row.difficulty === difficulty)!;
        expect(tables.difficulty_initial_evidence.filter((row) => row.difficulty_config_id === config.id)).toHaveLength(expected);
        expect(tables.difficulty_initial_clues.filter((row) => row.difficulty_config_id === config.id)).toHaveLength(1);
      }
    }
  });
  it('seeds the JJ-01 powder trace as its easy initial clue', () => {
    const tables = fourEpisodeContent();
    const episode = tables.episodes.find((row) => row.code === 'JJ-01')!;
    const easy = tables.episode_difficulty_configs.find((row) => row.episode_id === episode.id && row.difficulty === 'easy')!;
    const initial = tables.difficulty_initial_clues.find((row) => row.difficulty_config_id === easy.id)!;
    expect(tables.clues.find((row) => row.id === initial.clue_id)?.title).toContain('백색 분말');
  });
  it('assigns a unique local portrait asset to every suspect', () => {
    const paths = fourEpisodeContent().suspects.map((suspect) => suspect.image_url);
    expect(paths).toHaveLength(16);
    expect(paths.every((path) => typeof path === 'string' && path.startsWith('/images/suspects/'))).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
  });
  it('makes every CORE clue reachable and uses interaction conditions', () => {
    const tables = fourEpisodeContent();
    expect(validateContent(tables)).toEqual({ valid: true, errors: [] });
    const types = new Set(tables.clue_unlock_conditions.map((row) => row.condition_type));
    expect(types).toEqual(new Set(['EVIDENCE_VIEWED', 'QUESTION_TYPE_ASKED', 'FACT_USED', 'SUSPECT_INTERROGATED', 'CLUE_ACQUIRED']));
  });
  it('describes clues as observations or eliminations instead of naming the culprit', () => {
    const clues = fourEpisodeContent().clues;
    const visibleText = clues.map((row) => String(row.content)).join('\n');
    expect(visibleText).not.toMatch(/살해 동기|범인(?:을|은|이|이다)|진범|범행을 입증/);
    expect(clues.find((row) => row.code === 'GS-01-C2')?.content).toContain('두부 외상은 사인이 아니었다');
    expect(clues.find((row) => row.code === 'GS-01-C5')?.content).toContain('사랑채에 다시 들어갔음');
    expect(clues.find((row) => row.code === 'JL-01-C4')?.content).toContain('살인 은폐가 아니라');
    expect(clues.find((row) => row.code === 'CC-01-C2')?.content).toContain('핵심 시각과 동선이 겹치지 않는다');
    expect(clues.find((row) => row.code === 'JJ-01-C1')?.content).toContain('독 투입 시간과 다르다');
  });
  it('marks curated dialect seed rows with compact prompt metadata', () => {
    const rows = fourEpisodeContent().dialect_expressions;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.difficulty_rules).toEqual(expect.objectContaining({
        category: expect.any(String),
        intensity: expect.any(Number),
        question_types: expect.any(Array),
        emotion_tags: expect.any(Array),
        verification_status: 'APPROVED_FOR_MVP'
      }));
    }
  });
  it('does not increase row count on a second run', async () => {
    const writer = new MemoryWriter();
    const first = await runContentSeed(fixture(), writer);
    const rowCount = writer.rows.size;
    const second = await runContentSeed(fixture(), writer);
    expect(first.inserted).toBeGreaterThan(0);
    expect(second.inserted).toBe(0);
    expect(writer.rows.size).toBe(rowCount);
  });
  it('leaves the migration-owned clue condition graph unchanged', async () => {
    const writer = new MemoryWriter();
    await runContentSeed(fixture(), writer);
    expect(migrationManagedTables.has('clue_unlock_conditions')).toBe(true);
    expect([...writer.rows.keys()].some((key) => key.startsWith('clue_unlock_conditions:'))).toBe(false);
  });
  it('persists dialect references while stripping seed-only metadata', async () => {
    const tables = fixture();
    const episodeId = String(tables.episodes[0].id);
    tables.dialect_expressions.push({
      id: uuid(700), code: 'GS-D1', episode_id: episodeId,
      _episode_id: episodeId, _related_clue_id: tables.clues[0].id,
      expression: '됐다 고마', standard_meaning: '됐어요, 그만해요'
    });
    const writer = new MemoryWriter();
    await runContentSeed(tables, writer);
    const stored = writer.rows.get('dialect_expressions:GS-D1');
    expect(stored?.episode_id).toBe(episodeId);
    expect(stored?.related_clue_id).toBe(tables.clues[0].id);
    expect(stored?._episode_id).toBeUndefined();
    expect(stored?._related_clue_id).toBeUndefined();
  });
});
