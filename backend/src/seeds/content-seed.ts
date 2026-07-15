import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import type { Json } from '../shared/types/database.types.js';

export const episodeCodes = ['GS-01', 'JL-01', 'CC-01', 'JJ-01'] as const;
export type EpisodeCode = (typeof episodeCodes)[number];

export const tableOrder = [
  'regions', 'episodes', 'episode_difficulty_configs', 'victims', 'suspects',
  'episode_timelines', 'evidence', 'clues', 'clue_unlock_conditions',
  'difficulty_initial_evidence', 'difficulty_initial_clues', 'clue_evidence_unlocks',
  'evidence_clue_links', 'clue_suspect_impacts',
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
const isCoreClue = (row: SeedRow) => row._is_core === true || text(row, 'importance') === 'CORE';

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
      const configId = config && text(config, 'id');
      if (configId) {
        const initialEvidence = tables.difficulty_initial_evidence.filter((row) => text(row, 'difficulty_config_id') === configId);
        const expectedEvidenceCount = difficulty === 'easy' ? 3 : difficulty === 'normal' ? 2 : 1;
        if (initialEvidence.length !== expectedEvidenceCount) {
          errors.push(`${code}: ${difficulty} must provide ${expectedEvidenceCount} initial evidence rows`);
        }
        const initialClues = tables.difficulty_initial_clues.filter((row) => text(row, 'difficulty_config_id') === configId);
        if (initialClues.length > 1) errors.push(`${code}: ${difficulty} may provide at most 1 initial clue`);
      }
    }

    const clues = rowsForEpisode(tables.clues, episodeId);
    const clueIds = new Set(clues.map((row) => text(row, 'id')));
    const evidenceIds = new Set(rowsForEpisode(tables.evidence, episodeId).map((row) => text(row, 'id')));
    const suspectIds = new Set(suspects.map((row) => text(row, 'id')));
    if (!clues.some(isCoreClue)) errors.push(`${code}: CORE clue is missing`);

    const difficultyIds = new Set(difficulties.map((row) => text(row, 'id')).filter((value): value is string => Boolean(value)));
    const reachableEvidenceIds = new Set(
      tables.difficulty_initial_evidence
        .filter((row) => difficultyIds.has(text(row, 'difficulty_config_id') ?? ''))
        .map((row) => text(row, 'evidence_id'))
        .filter((value): value is string => Boolean(value))
    );
    const reachableClues = new Set(
      tables.difficulty_initial_clues
        .filter((row) => difficultyIds.has(text(row, 'difficulty_config_id') ?? ''))
        .map((row) => text(row, 'clue_id'))
        .filter((value): value is string => Boolean(value))
    );
    let changed = true;
    while (changed) {
      changed = false;
      for (const clue of clues) {
        const clueId = text(clue, 'id');
        if (!clueId || reachableClues.has(clueId)) continue;
        const groups = new Map<number, SeedRow[]>();
        for (const condition of tables.clue_unlock_conditions.filter((row) => text(row, 'clue_id') === clueId)) {
          const groupNo = typeof condition.group_no === 'number' ? condition.group_no : 1;
          groups.set(groupNo, [...(groups.get(groupNo) ?? []), condition]);
        }
        const reachable = [...groups.values()].some((conditions) => conditions.every((condition) => {
          const kind = text(condition, 'condition_type');
          if (kind === 'EVIDENCE_VIEWED' || kind === 'EVIDENCE_PRESENTED') {
            return reachableEvidenceIds.has(text(condition, '_target_evidence_id') ?? text(condition, 'target_ref') ?? '');
          }
          if (kind === 'CLUE_ACQUIRED') return reachableClues.has(text(condition, '_target_clue_id') ?? '');
          return ['QUESTION_TYPE_ASKED', 'FACT_USED', 'FACT_REVEALED', 'CLAIM_RECORDED', 'SUSPECT_INTERROGATED', 'MESSAGE_EXISTS', 'EMOTION_REACHED'].includes(kind ?? '');
        }));
        if (reachable) {
          reachableClues.add(clueId);
          for (const unlock of tables.clue_evidence_unlocks.filter((row) => text(row, 'clue_id') === clueId)) {
            const unlockedEvidenceId = text(unlock, 'evidence_id');
            if (unlockedEvidenceId) reachableEvidenceIds.add(unlockedEvidenceId);
          }
          changed = true;
        }
      }
    }
    for (const clue of clues.filter(isCoreClue)) {
      const clueId = text(clue, 'id');
      if (clueId && !reachableClues.has(clueId)) errors.push(`${code}: CORE clue ${text(clue, 'code') ?? clueId} is not reachable`);
    }

    for (const condition of tables.clue_unlock_conditions.filter((row) => clueIds.has(text(row, 'clue_id')))) {
      for (const [key, targets] of [['_target_clue_id', clueIds], ['_target_evidence_id', evidenceIds], ['_target_suspect_id', suspectIds]] as const) {
        const target = text(condition, key);
        if (target && !targets.has(target)) errors.push(`${code}: clue condition ${key} target does not exist in the episode`);
      }
    }
    for (const initial of tables.difficulty_initial_evidence.filter((row) => difficultyIds.has(text(row, 'difficulty_config_id') ?? ''))) {
      if (!evidenceIds.has(text(initial, 'evidence_id'))) errors.push(`${code}: initial evidence belongs to another episode`);
    }
    for (const initial of tables.difficulty_initial_clues.filter((row) => difficultyIds.has(text(row, 'difficulty_config_id') ?? ''))) {
      if (!clueIds.has(text(initial, 'clue_id'))) errors.push(`${code}: initial clue belongs to another episode`);
    }
    for (const unlock of tables.clue_evidence_unlocks.filter((row) => clueIds.has(text(row, 'clue_id')))) {
      if (!evidenceIds.has(text(unlock, 'evidence_id'))) errors.push(`${code}: unlocked evidence belongs to another episode`);
    }
    for (const link of tables.evidence_clue_links.filter((row) => text(row, 'episode_id') === episodeId)) {
      if (!evidenceIds.has(text(link, 'evidence_id')) || !clueIds.has(text(link, 'clue_id'))) {
        errors.push(`${code}: evidence-clue link crosses episode boundaries`);
      }
    }
    for (const impact of tables.clue_suspect_impacts.filter((row) => clueIds.has(text(row, 'clue_id')))) {
      if (!suspectIds.has(text(impact, 'suspect_id'))) errors.push(`${code}: clue impact targets another episode`);
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

const stripSeedMetadata = (row: SeedRow, table: ContentTable): SeedRow => {
  const stored = Object.fromEntries(Object.entries(row).filter(([key]) => !key.startsWith('_')));
  if (table === 'dialect_expressions' && typeof row._episode_id === 'string') stored.episode_id = row._episode_id;
  if (table === 'dialect_expressions' && typeof row._related_clue_id === 'string') stored.related_clue_id = row._related_clue_id;
  return stored;
};
const codeTables = new Set<ContentTable>(['regions', 'episodes', 'suspects', 'evidence', 'clues', 'dialect_expressions', 'endings']);
export const migrationManagedTables = new Set<ContentTable>(['clue_unlock_conditions']);

export const runContentSeed = async (tables: SeedTables, writer: ContentSeedWriter) => {
  const validation = validateContent(tables);
  if (!validation.valid) return { inserted: 0, updated: 0, validationErrors: validation.errors };
  let inserted = 0;
  let updated = 0;
  for (const table of tableOrder) {
    // The complete clue graph is migration-owned. Skipping it prevents the
    // compact fallback content from overwriting or duplicating deployed rules.
    if (migrationManagedTables.has(table)) continue;
    const result = await writer.upsert(table, tables[table].map((row) => stripSeedMetadata(row, table)), codeTables.has(table) ? 'code' : 'id');
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
