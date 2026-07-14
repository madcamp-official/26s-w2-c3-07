import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = (name: string) => readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), 'utf8');
const validationSql = migration('20260714125447_align_interrogation_fact_validation.sql');
const labelSql = migration('20260714122853_add_korean_interrogation_labels.sql');

describe('interrogation database migrations', () => {
  it('aligns finalize validation with the effective response rule without allowing SERVER_ONLY facts', () => {
    expect(validationSql).toContain("p_response_metadata ->> 'effectiveRuleType'");
    expect(validationSql).toContain("fact.disclosure_level <> 'SERVER_ONLY'");
    expect(validationSql).toContain('hidden_rule.hidden_fact_refs');
    expect(validationSql).toContain('allowed_rule.allowed_fact_refs');
    expect(validationSql).toContain('public.interrogation_messages as prior');
    expect(validationSql).toContain("raise exception 'INTERROGATION_FACT_NOT_ALLOWED'");
    expect(validationSql).toContain("set search_path = ''");
  });

  it('defines immutable Korean label functions and every generated display column', () => {
    for (const functionName of ['question_type_label_ko', 'emotion_label_ko', 'emotion_trigger_label_ko']) {
      expect(labelSql).toContain(`function game_content.${functionName}`);
    }
    for (const column of [
      'initial_emotion_ko', 'question_type_ko', 'trigger_type_ko', 'from_emotion_ko', 'to_emotion_ko',
      'current_emotion_ko', 'emotion_before_ko', 'emotion_after_ko'
    ]) expect(labelSql).toContain(column);
    expect(labelSql).toContain("metadata ->> 'questionType'");
    expect(labelSql).toContain("when 'Q-EVIDENCE' then '증거 질문'");
    expect(labelSql).toContain("when 'NERVOUS' then '불안'");
  });
});
