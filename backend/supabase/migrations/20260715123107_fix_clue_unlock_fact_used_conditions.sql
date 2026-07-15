-- Interrogation responses reliably record facts reflected in the answer in
-- used_fact_refs. Progression clues therefore use FACT_USED, while the
-- FACT_REVEALED evaluator remains available for genuinely new disclosures.
update game_content.clue_unlock_conditions as condition
set condition_type = 'FACT_USED'
from game_content.clues as clue
where clue.id = condition.clue_id
  and condition.condition_type = 'FACT_REVEALED'
  and clue.code in (
    'CC-01-C2', 'CC-01-C3', 'CC-01-C4', 'CC-01-C5',
    'GS-01-C3', 'GS-01-C4', 'GS-01-C5',
    'JJ-01-C1', 'JJ-01-C2', 'JJ-01-C4',
    'JL-01-C2', 'JL-01-C4', 'JL-01-C5'
  );

create or replace function game_private.clue_condition_is_met(
  p_session_id uuid,
  p_condition_id uuid,
  p_current_message_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_condition game_content.clue_unlock_conditions%rowtype;
  v_measure bigint := 0;
  v_threshold bigint := 1;
begin
  select condition.* into v_condition
  from game_content.clue_unlock_conditions as condition
  where condition.id = p_condition_id;
  if not found then return false; end if;

  if v_condition.operator = 'GTE' and jsonb_typeof(v_condition.expected_value) = 'number' then
    v_threshold := greatest((v_condition.expected_value #>> '{}')::bigint, 0);
  end if;

  if v_condition.condition_type = 'EVIDENCE_VIEWED' then
    select count(*) into v_measure from public.session_evidence as evidence
    where evidence.session_id = p_session_id and evidence.viewed_at is not null
      and (v_condition.operator = 'GTE' or evidence.evidence_id::text = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? evidence.evidence_id::text));
  elsif v_condition.condition_type = 'EVIDENCE_PRESENTED' then
    select count(*) into v_measure
    from public.interrogation_messages as message
    cross join lateral jsonb_array_elements_text(message.presented_evidence_refs) as evidence(evidence_id)
    where message.session_id = p_session_id
      and (p_current_message_id is null or message.id = p_current_message_id)
      and (v_condition.operator = 'GTE' or evidence.evidence_id = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? evidence.evidence_id));
  elsif v_condition.condition_type = 'QUESTION_TYPE_ASKED' then
    select count(*) into v_measure from public.interrogation_messages as message
    where message.session_id = p_session_id
      and (p_current_message_id is null or message.id = p_current_message_id)
      and (v_condition.operator = 'GTE' or message.question_type = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? message.question_type));
  elsif v_condition.condition_type = 'SUSPECT_INTERROGATED' then
    select count(*) into v_measure from public.interrogation_messages as message
    where message.session_id = p_session_id
      and (p_current_message_id is null or message.id = p_current_message_id)
      and (v_condition.operator = 'GTE' or v_condition.target_ref is null or message.suspect_id::text = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? message.suspect_id::text));
  elsif v_condition.condition_type = 'FACT_USED' then
    select count(distinct fact.fact_id) into v_measure
    from public.interrogation_messages as message
    cross join lateral jsonb_array_elements_text(message.used_fact_refs) as fact(fact_id)
    where message.session_id = p_session_id
      and (v_condition.operator = 'GTE' or fact.fact_id = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? fact.fact_id));
  elsif v_condition.condition_type = 'FACT_REVEALED' then
    select count(distinct fact.fact_id) into v_measure
    from public.interrogation_messages as message
    cross join lateral jsonb_array_elements_text(message.revealed_fact_refs) as fact(fact_id)
    where message.session_id = p_session_id
      and (v_condition.operator = 'GTE' or fact.fact_id = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? fact.fact_id));
  elsif v_condition.condition_type = 'CLAIM_RECORDED' then
    select count(distinct fact.fact_id) into v_measure
    from public.interrogation_messages as message
    cross join lateral jsonb_array_elements_text(message.claimed_fact_refs) as fact(fact_id)
    where message.session_id = p_session_id
      and (v_condition.operator = 'GTE' or fact.fact_id = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? fact.fact_id));
  elsif v_condition.condition_type = 'CLUE_ACQUIRED' then
    select count(*) into v_measure from public.session_clues as acquired
    where acquired.session_id = p_session_id
      and (v_condition.operator = 'GTE' or acquired.clue_id::text = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? acquired.clue_id::text));
  else
    raise log 'Unknown clue condition type: %', v_condition.condition_type;
    return false;
  end if;

  if v_condition.operator = 'GTE' then return v_measure >= v_threshold; end if;
  if v_condition.operator = 'EQ' and jsonb_typeof(v_condition.expected_value) = 'boolean' then
    return (v_measure > 0) = (v_condition.expected_value #>> '{}')::boolean;
  end if;
  return v_measure > 0;
end;
$$;

revoke all on function game_private.clue_condition_is_met(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function game_private.clue_condition_is_met(uuid, uuid, uuid) to service_role;
