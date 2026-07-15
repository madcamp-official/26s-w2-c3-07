update game_content.dialect_expressions
set difficulty_rules = jsonb_set(
      coalesce(difficulty_rules, '{}'::jsonb),
      '{verification_status}',
      '"APPROVED_FOR_MVP"'::jsonb,
      true
    ),
    updated_at = now()
where code like '%-MVP-%'
  and coalesce(difficulty_rules ->> 'verification_status', '') <> 'VERIFIED';
