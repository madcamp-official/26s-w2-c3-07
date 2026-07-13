import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { Json } from '../shared/types/database.types.js';

export const episodeCodes = ['GS-01', 'JL-01', 'CC-01', 'JJ-01'] as const;
export type EpisodeCode = (typeof episodeCodes)[number];

export const tableOrder = [
  'regions', 'episodes', 'episode_difficulty_configs', 'victims', 'suspects',
  'episode_timelines', 'evidence', 'clues', 'clue_unlock_conditions',
  'dialect_expressions', 'suspect_facts', 'suspect_lies', 'suspect_response_rules',
  'suspect_emotion_rules', 'suspect_relationships', 'endings'
] as const;
export type ContentTable = (typeof tableOrder)[number];
export type SeedRow = Record<string, Json | undefined>;
export type SeedTables = Record<ContentTable, SeedRow[]>;

const rowSchema = z.record(z.string(), z.unknown());
const tablesShape = Object.fromEntries(tableOrder.map((table) => [table, z.array(rowSchema)])) as Record<ContentTable, z.ZodArray<typeof rowSchema>>;
const documentSchema = z.object({ version: z.literal(1), tables: z.object(tablesShape) });

export type ValidationResult = { valid: boolean; errors: string[] };
export type WriteResult = { inserted: number; updated: number };
export interface ContentSeedWriter {
  upsert(table: ContentTable, rows: SeedRow[], conflictKey: 'code' | 'id'): Promise<WriteResult>;
  updateEpisodeCulprit(episodeId: string, suspectId: string): Promise<WriteResult>;
}

const text = (row: SeedRow, key: string) => typeof row[key] === 'string' ? row[key] as string : undefined;
const rowsForEpisode = (rows: SeedRow[], episodeId: string) => rows.filter((row) => text(row, 'episode_id') === episodeId);

export const validateContent = (tables: SeedTables): ValidationResult => {
  const errors: string[] = [];
  for (const table of tableOrder) {
    const conflictKey = codeTables.has(table) ? 'code' : 'id';
    tables[table].forEach((row, index) => {
      if (!text(row, conflictKey)) errors.push(`${table}[${index}]: stable ${conflictKey} is required for idempotent upsert`);
    });
  }
  const episodes = new Map(tables.episodes.map((row) => [text(row, 'code'), row]));
  for (const code of episodeCodes) if (!episodes.has(code)) errors.push(`${code}: content specification is missing`);

  for (const code of episodeCodes) {
    const episode = episodes.get(code);
    if (!episode) continue;
    const episodeId = text(episode, 'id');
    if (!episodeId) { errors.push(`${code}: episode id is required`); continue; }
    const suspects = rowsForEpisode(tables.suspects, episodeId);
    const victims = rowsForEpisode(tables.victims, episodeId);
    if (suspects.length !== 4) errors.push(`${code}: expected 4 suspects, found ${suspects.length}`);
    if (victims.length !== 1) errors.push(`${code}: expected 1 victim, found ${victims.length}`);
    const culpritId = text(episode, '_culprit_suspect_id');
    if (!culpritId || !suspects.some((row) => text(row, 'id') === culpritId)) errors.push(`${code}: culprit must belong to the episode`);

    const difficulties = rowsForEpisode(tables.episode_difficulty_configs, episodeId);
    for (const difficulty of ['easy', 'normal', 'hard']) {
      const config = difficulties.find((row) => text(row, 'difficulty') === difficulty);
      if (!config) errors.push(`${code}: ${difficulty} difficulty is missing`);
      const expected = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 8 : code === 'JJ-01' ? 6 : 4;
      if (config?.total_questions !== expected) errors.push(`${code}: ${difficulty} must allow ${expected} total questions`);
    }

    const clues = rowsForEpisode(tables.clues, episodeId);
    const clueIds = new Set(clues.map((row) => text(row, 'id')));
    const evidenceIds = new Set(rowsForEpisode(tables.evidence, episodeId).map((row) => text(row, 'id')));
    const suspectIds = new Set(suspects.map((row) => text(row, 'id')));
    if (!clues.some((row) => row._is_core === true || text(row, 'clue_type') === 'CORE')) errors.push(`${code}: CORE clue is missing`);

    for (const condition of tables.clue_unlock_conditions.filter((row) => clueIds.has(text(row, 'clue_id')))) {
      for (const [key, targets] of [['_target_clue_id', clueIds], ['_target_evidence_id', evidenceIds], ['_target_suspect_id', suspectIds]] as const) {
        const target = text(condition, key);
        if (target && !targets.has(target)) errors.push(`${code}: clue condition ${key} target does not exist in the episode`);
      }
    }
    for (const ending of rowsForEpisode(tables.endings, episodeId)) {
      const target = text(ending, '_target_suspect_id');
      if (target && !suspectIds.has(target)) errors.push(`${code}: ending target suspect belongs to another episode`);
    }
    for (const expression of tables.dialect_expressions) {
      const related = text(expression, '_related_clue_id');
      const relatedEpisode = text(expression, '_episode_id');
      if (relatedEpisode === episodeId && related && !clueIds.has(related)) errors.push(`${code}: dialect related clue belongs to another episode`);
    }
  }
  return { valid: errors.length === 0, errors };
};

const stripSeedMetadata = (row: SeedRow): SeedRow => Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith('_')));
const codeTables = new Set<ContentTable>(['regions', 'episodes', 'suspects', 'evidence', 'clues', 'dialect_expressions', 'endings']);

export const runContentSeed = async (tables: SeedTables, writer: ContentSeedWriter) => {
  const validation = validateContent(tables);
  if (!validation.valid) return { inserted: 0, updated: 0, validationErrors: validation.errors };
  let inserted = 0;
  let updated = 0;
  for (const table of tableOrder) {
    const result = await writer.upsert(table, tables[table].map(stripSeedMetadata), codeTables.has(table) ? 'code' : 'id');
    inserted += result.inserted;
    updated += result.updated;
    if (table === 'suspects') {
      for (const episode of tables.episodes) {
        const episodeId = text(episode, 'id');
        const culpritId = text(episode, '_culprit_suspect_id');
        if (episodeId && culpritId) {
          const culpritResult = await writer.updateEpisodeCulprit(episodeId, culpritId);
          inserted += culpritResult.inserted;
          updated += culpritResult.updated;
        }
      }
    }
  }
  return { inserted, updated, validationErrors: [] as string[] };
};

const emptyTables = (): SeedTables => Object.fromEntries(tableOrder.map((table) => [table, []])) as unknown as SeedTables;

export const loadContentDocuments = async (directory: string): Promise<SeedTables> => {
  const tables = emptyTables();
  const files = (await readdir(directory, { withFileTypes: true }).catch(() => [])).filter((entry) => entry.isFile() && entry.name.endsWith('.json'));
  for (const file of files) {
    const parsed = documentSchema.parse(JSON.parse(await readFile(resolve(directory, file.name), 'utf8')));
    for (const table of tableOrder) tables[table].push(...parsed.tables[table] as SeedRow[]);
  }
  return tables;
};
