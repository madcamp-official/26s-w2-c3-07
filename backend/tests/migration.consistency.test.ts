import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migrationDirectory = new URL('../supabase/migrations/', import.meta.url);
const baseline = readFileSync(new URL('20260712185351_create_player_runtime_schema.sql', migrationDirectory), 'utf8');
const databaseTypes = readFileSync(new URL('../src/shared/types/database.types.ts', import.meta.url), 'utf8');
const sessionTypes = readFileSync(new URL('../src/modules/session/session.types.ts', import.meta.url), 'utf8');

const expectedMigrations = [
  '20260712185317_create_game_content_schema.sql',
  '20260712185351_create_player_runtime_schema.sql',
  '20260712185417_add_runtime_rls_and_grants.sql',
  '20260712185456_harden_public_security_definer_functions.sql',
  '20260712185525_add_missing_foreign_key_indexes.sql',
  '20260713081635_align_runtime_auth_settings.sql',
  '20260713082727_align_content_difficulty_values.sql',
  '20260713082845_add_global_content_code_constraints.sql',
  '20260713103456_create_runtime_session_rpc.sql',
  '20260713103507_align_runtime_game_rpcs.sql',
  '20260714065134_strengthen_clue_unlock_schema.sql',
  '20260714065529_remove_duplicate_clue_condition_index.sql',
  '20260714074318_llm_clue_unlock_integration.sql',
  '20260714103128_initial_evidence_clue_progression.sql',
  '20260714103355_fix_clue_evidence_viewed_at_type.sql',
  '20260714114404_approve_mvp_dialect_expressions.sql',
  '20260714122853_add_korean_interrogation_labels.sql',
  '20260714125447_align_interrogation_fact_validation.sql',
  '20260715024353_allow_expired_session_deduction.sql',
  '20260715072143_add_ending_truth_fields.sql',
  '20260715072156_add_initial_clues_for_all_difficulties.sql',
  '20260715072217_neutralize_suspect_public_profiles.sql',
  '20260715080930_make_clues_indirect.sql',
  '20260715123107_fix_clue_unlock_fact_used_conditions.sql'
];
const migrationSql = expectedMigrations
  .map((name) => readFileSync(new URL(name, migrationDirectory), 'utf8'))
  .join('\n');

describe('migration and runtime schema consistency', () => {
  it('keeps the audited production migration history in deterministic order', () => {
    expect(readdirSync(migrationDirectory).filter((name) => name.endsWith('.sql')).sort()).toEqual(expectedMigrations);
  });

  it('uses the deployed runtime column names instead of legacy synthetic names', () => {
    for (const column of [
      'bgm_enabled', 'sfx_enabled', 'current_emotion', 'questions_used',
      'user_question', 'npc_response', 'emotion_before', 'emotion_after',
      'used_fact_refs', 'revealed_fact_refs', 'claimed_fact_refs',
      'presented_evidence_refs', 'acquired_at', 'acquired_from_type', 'acquired_from_ref'
    ]) expect(migrationSql).toContain(column);

    for (const legacyColumn of ['sound_enabled', 'music_enabled', 'questions_asked', 'discovered_at']) {
      expect(baseline).not.toContain(legacyColumn);
    }
    expect(baseline).toContain('id uuid primary key references auth.users(id)');
    expect(baseline).not.toContain('profiles.user_id');
  });

  it('keeps the database session status constraint aligned with the TypeScript union', () => {
    const statusCheck = baseline.match(/status text not null default 'CREATED' check \(status in \(([^)]+)\)\)/)?.[1];
    const dbStatuses = [...(statusCheck?.matchAll(/'([^']+)'/g) ?? [])].map((match) => match[1]);
    const typeBlock = sessionTypes.match(/export type DbSessionStatus =([\s\S]*?);/)?.[1] ?? '';
    const typedStatuses = [...typeBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]);
    expect(dbStatuses).toEqual(typedStatuses);
  });

  it('keeps nullable runtime timestamps and RPC names represented in database types', () => {
    expect(databaseTypes).toContain('expires_at: string | null');
    for (const rpc of [
      'initialize_game_session', 'finalize_interrogation', 'evaluate_session_clues',
      'view_session_evidence', 'submit_final_deduction', 'claim_ending_report_generation',
      'complete_ending_report_generation', 'fail_ending_report_generation'
    ]) expect(databaseTypes).toContain(`${rpc}:`);
  });
});
