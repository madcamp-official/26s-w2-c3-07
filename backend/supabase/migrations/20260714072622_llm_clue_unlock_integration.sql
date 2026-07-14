alter table public.interrogation_messages
  add column if not exists used_fact_refs jsonb not null default '[]'::jsonb,
  add column if not exists revealed_fact_refs jsonb not null default '[]'::jsonb,
  add column if not exists claimed_fact_refs jsonb not null default '[]'::jsonb,
  add column if not exists presented_evidence_refs jsonb not null default '[]'::jsonb;

create table if not exists game_content.evidence_clue_links (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  evidence_id uuid not null references game_content.evidence(id) on delete cascade,
  clue_id uuid not null references game_content.clues(id) on delete cascade,
  link_type text not null check (link_type in ('SUPPORTS','REVEALS','CONTRADICTS','CORROBORATES','REQUIRED_WITH','EXCLUDES','RED_HERRING')),
  explanation text not null,
  strength integer not null default 0,
  is_required boolean not null default false,
  created_at timestamptz not null default now(),
  unique (evidence_id, clue_id, link_type)
);

create table if not exists game_content.clue_suspect_impacts (
  id uuid primary key default gen_random_uuid(),
  clue_id uuid not null references game_content.clues(id) on delete cascade,
  suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  impact_type text not null check (impact_type in ('SUPPORTS_GUILT','WEAKENS_ALIBI','PROVES_MOTIVE','PROVES_OPPORTUNITY','PROVES_METHOD','EXCLUDES','EXPLAINS_LIE','RED_HERRING')),
  weight integer not null default 0,
  explanation text not null,
  created_at timestamptz not null default now(),
  unique (clue_id, suspect_id, impact_type)
);

create index if not exists evidence_clue_links_episode_idx on game_content.evidence_clue_links (episode_id, evidence_id, clue_id);
create index if not exists clue_suspect_impacts_suspect_idx on game_content.clue_suspect_impacts (suspect_id, clue_id);

alter table game_content.clue_unlock_conditions drop constraint if exists clue_unlock_conditions_type_check;
alter table game_content.clue_unlock_conditions
  add constraint clue_unlock_conditions_type_check check (condition_type in (
    'EVIDENCE_VIEWED','EVIDENCE_PRESENTED','QUESTION_TYPE_ASKED','SUSPECT_INTERROGATED',
    'FACT_USED','FACT_REVEALED','CLAIM_RECORDED','CLUE_ACQUIRED'
  )) not valid;

revoke all on table game_content.evidence_clue_links from public, anon, authenticated;
revoke all on table game_content.clue_suspect_impacts from public, anon, authenticated;
grant all on table game_content.evidence_clue_links to service_role;
grant all on table game_content.clue_suspect_impacts to service_role;

drop function if exists game_private.clue_condition_is_met(uuid, uuid);
drop function if exists game_private.clue_condition_is_met(uuid, uuid, uuid);
create function game_private.clue_condition_is_met(
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
    where message.id = p_current_message_id and message.session_id = p_session_id
      and (v_condition.operator = 'GTE' or evidence.evidence_id = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? evidence.evidence_id));
  elsif v_condition.condition_type = 'QUESTION_TYPE_ASKED' then
    select count(*) into v_measure from public.interrogation_messages as message
    where message.id = p_current_message_id and message.session_id = p_session_id
      and (v_condition.operator = 'GTE' or message.question_type = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? message.question_type));
  elsif v_condition.condition_type = 'SUSPECT_INTERROGATED' then
    select count(*) into v_measure from public.interrogation_messages as message
    where message.id = p_current_message_id and message.session_id = p_session_id
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

drop function if exists game_private.evaluate_clue_unlocks(uuid, text);
drop function if exists game_private.evaluate_clue_unlocks(uuid, text, uuid);
create function game_private.evaluate_clue_unlocks(
  p_session_id uuid,
  p_source text default 'SERVER',
  p_current_message_id uuid default null
)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch uuid[];
  v_unlocked uuid[] := array[]::uuid[];
begin
  loop
    with eligible as (
      select clue.id
      from public.game_sessions as session
      join game_content.clues as clue on clue.episode_id = session.episode_id
      where session.id = p_session_id
        and not exists (select 1 from public.session_clues as acquired where acquired.session_id = p_session_id and acquired.clue_id = clue.id)
        and exists (select 1 from game_content.clue_unlock_conditions as condition where condition.clue_id = clue.id)
        and exists (
          select 1 from (
            select condition.group_no,
              bool_and(game_private.clue_condition_is_met(p_session_id, condition.id, p_current_message_id)) as satisfied
            from game_content.clue_unlock_conditions as condition
            where condition.clue_id = clue.id
            group by condition.group_no
          ) as condition_group where condition_group.satisfied
        )
    ), inserted as (
      insert into public.session_clues (session_id, clue_id, acquired_from_type, acquired_from_ref, acquired_at)
      select p_session_id, eligible.id, left(coalesce(p_source, 'SERVER'), 100), p_current_message_id, now()
      from eligible on conflict (session_id, clue_id) do nothing returning clue_id
    )
    select coalesce(array_agg(inserted.clue_id), array[]::uuid[]) into v_batch from inserted;
    exit when cardinality(v_batch) = 0;
    v_unlocked := v_unlocked || v_batch;
  end loop;
  return v_unlocked;
end;
$$;

drop function if exists public.finalize_interrogation(uuid, uuid, uuid, uuid, text, text, text, text, uuid[], text, text);
drop function if exists public.finalize_interrogation(uuid, uuid, uuid, uuid, text, text, text, text, uuid[], uuid[], uuid[], uuid[], text, text, jsonb);
create function public.finalize_interrogation(
  p_user_id uuid, p_session_id uuid, p_request_id uuid, p_suspect_id uuid,
  p_question text, p_dialect_response text, p_question_type text, p_emotion text,
  p_used_fact_ids uuid[], p_revealed_fact_ids uuid[], p_claimed_fact_ids uuid[],
  p_presented_evidence_ids uuid[], p_evasion_type text, p_consistency_status text,
  p_response_metadata jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.game_sessions%rowtype;
  v_state public.session_suspect_states%rowtype;
  v_existing public.interrogation_messages%rowtype;
  v_message public.interrogation_messages%rowtype;
  v_questions_per_suspect integer;
  v_new_clue_ids uuid[];
begin
  select session.* into v_session from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id for update;
  if not found then raise exception 'INTERROGATION_SESSION_NOT_FOUND' using errcode = 'P0001'; end if;

  select message.* into v_existing from public.interrogation_messages as message where message.request_id = p_request_id;
  if found then
    if v_existing.session_id <> p_session_id then raise exception 'INTERROGATION_REQUEST_ID_CONFLICT' using errcode = 'P0001'; end if;
    return jsonb_build_object('duplicate', true, 'message', to_jsonb(v_existing), 'newClueIds', '[]'::jsonb,
      'remainingQuestions', v_session.remaining_questions);
  end if;

  if v_session.status <> 'INTERROGATING' then raise exception 'INTERROGATION_STATE_INVALID' using errcode = 'P0001'; end if;
  if v_session.expires_at <= now() then raise exception 'INTERROGATION_SESSION_EXPIRED' using errcode = 'P0001'; end if;
  if v_session.remaining_questions <= 0 then raise exception 'INTERROGATION_QUESTIONS_EXHAUSTED' using errcode = 'P0001'; end if;
  if v_session.current_suspect_id is distinct from p_suspect_id then raise exception 'INTERROGATION_SUSPECT_NOT_SELECTED' using errcode = 'P0001'; end if;
  if char_length(btrim(p_question)) not between 2 and 500 or char_length(btrim(p_dialect_response)) not between 2 and 500
     or p_consistency_status not in ('valid', 'invalid') then raise exception 'INTERROGATION_PAYLOAD_INVALID' using errcode = 'P0001'; end if;

  if exists (
    select 1 from unnest(coalesce(p_presented_evidence_ids, array[]::uuid[])) as presented(evidence_id)
    where not exists (
      select 1 from public.session_evidence as available
      join game_content.evidence as evidence on evidence.id = available.evidence_id
      where available.session_id = p_session_id and available.evidence_id = presented.evidence_id
        and evidence.episode_id = v_session.episode_id
    )
  ) then raise exception 'INTERROGATION_EVIDENCE_NOT_AVAILABLE' using errcode = 'P0001'; end if;

  if exists (
    select 1
    from unnest(coalesce(p_used_fact_ids, array[]::uuid[]) || coalesce(p_revealed_fact_ids, array[]::uuid[]) || coalesce(p_claimed_fact_ids, array[]::uuid[])) as referenced(fact_id)
    where not exists (
      select 1 from game_content.suspect_facts as fact
      where fact.id = referenced.fact_id and fact.suspect_id = p_suspect_id and fact.disclosure_level <> 'SERVER_ONLY'
        and (
          fact.disclosure_level = 'LLM_ALLOWED'
          or exists (
            select 1 from game_content.suspect_response_rules as rule
            where rule.suspect_id = p_suspect_id and rule.question_type = p_question_type
              and (rule.allowed_fact_refs ? fact.id::text or rule.allowed_fact_refs ? fact.code)
              and not (rule.hidden_fact_refs ? fact.id::text or rule.hidden_fact_refs ? fact.code)
          )
          or exists (
            select 1 from public.interrogation_messages as prior
            cross join lateral jsonb_array_elements_text(prior.revealed_fact_refs) as revealed(fact_id)
            where prior.session_id = p_session_id and revealed.fact_id = fact.id::text
          )
        )
    )
  ) then raise exception 'INTERROGATION_FACT_NOT_ALLOWED' using errcode = 'P0001'; end if;

  select state.* into v_state from public.session_suspect_states as state
  where state.session_id = p_session_id and state.suspect_id = p_suspect_id for update;
  if not found then raise exception 'INTERROGATION_SUSPECT_NOT_IN_EPISODE' using errcode = 'P0001'; end if;
  select config.questions_per_suspect into v_questions_per_suspect
  from game_content.episode_difficulty_configs as config
  where config.id = v_session.difficulty_config_id and config.episode_id = v_session.episode_id;
  if v_state.questions_used >= v_questions_per_suspect then raise exception 'INTERROGATION_SUSPECT_LIMIT_REACHED' using errcode = 'P0001'; end if;

  insert into public.interrogation_messages (
    session_id, suspect_id, request_id, user_question, question_type, npc_response,
    emotion_before, emotion_after, evasion_type, used_fact_refs, revealed_fact_refs,
    claimed_fact_refs, presented_evidence_refs, question_cost, response_metadata
  ) values (
    p_session_id, p_suspect_id, p_request_id, btrim(p_question), p_question_type, btrim(p_dialect_response),
    v_state.current_emotion, p_emotion, p_evasion_type, to_jsonb(coalesce(p_used_fact_ids, array[]::uuid[])),
    to_jsonb(coalesce(p_revealed_fact_ids, array[]::uuid[])), to_jsonb(coalesce(p_claimed_fact_ids, array[]::uuid[])),
    to_jsonb(coalesce(p_presented_evidence_ids, array[]::uuid[])), 1,
    coalesce(p_response_metadata, '{}'::jsonb) || jsonb_build_object('characterConsistencyStatus', p_consistency_status)
  ) returning * into v_message;

  update public.game_sessions set remaining_questions = remaining_questions - 1, last_activity_at = now(), updated_at = now()
  where id = p_session_id returning remaining_questions into v_session.remaining_questions;
  update public.session_suspect_states set current_emotion = p_emotion, questions_used = questions_used + 1,
    interrogation_status = case when questions_used + 1 >= v_questions_per_suspect then 'EXHAUSTED' else 'AVAILABLE' end,
    last_interrogated_at = now(), updated_at = now() where id = v_state.id;

  v_new_clue_ids := game_private.evaluate_clue_unlocks(p_session_id, 'INTERROGATION', v_message.id);
  return jsonb_build_object('duplicate', false, 'message', to_jsonb(v_message),
    'newClueIds', to_jsonb(v_new_clue_ids), 'remainingQuestions', v_session.remaining_questions);
end;
$$;

create or replace function public.evaluate_session_clues(p_user_id uuid, p_session_id uuid, p_source text default 'SERVER')
returns uuid[] language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.game_sessions as session where session.id = p_session_id and session.user_id = p_user_id)
  then raise exception 'CLUE_SESSION_NOT_FOUND' using errcode = 'P0001'; end if;
  return game_private.evaluate_clue_unlocks(p_session_id, p_source, null);
end;
$$;

revoke all on function game_private.clue_condition_is_met(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function game_private.evaluate_clue_unlocks(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.finalize_interrogation(uuid, uuid, uuid, uuid, text, text, text, text, uuid[], uuid[], uuid[], uuid[], text, text, jsonb) from public, anon, authenticated;
revoke all on function public.evaluate_session_clues(uuid, uuid, text) from public, anon, authenticated;
grant execute on function game_private.clue_condition_is_met(uuid, uuid, uuid) to service_role;
grant execute on function game_private.evaluate_clue_unlocks(uuid, text, uuid) to service_role;
grant execute on function public.finalize_interrogation(uuid, uuid, uuid, uuid, text, text, text, text, uuid[], uuid[], uuid[], uuid[], text, text, jsonb) to service_role;
grant execute on function public.evaluate_session_clues(uuid, uuid, text) to service_role;
