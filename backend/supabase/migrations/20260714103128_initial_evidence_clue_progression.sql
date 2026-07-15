alter table public.session_evidence
  alter column viewed_at drop not null,
  alter column viewed_at drop default;

create table game_content.difficulty_initial_evidence (
  id uuid primary key default gen_random_uuid(),
  difficulty_config_id uuid not null references game_content.episode_difficulty_configs(id) on delete cascade,
  evidence_id uuid not null references game_content.evidence(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (difficulty_config_id, evidence_id)
);

create table game_content.difficulty_initial_clues (
  id uuid primary key default gen_random_uuid(),
  difficulty_config_id uuid not null references game_content.episode_difficulty_configs(id) on delete cascade,
  clue_id uuid not null references game_content.clues(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  unique (difficulty_config_id, clue_id)
);

create table game_content.clue_evidence_unlocks (
  id uuid primary key default gen_random_uuid(),
  clue_id uuid not null references game_content.clues(id) on delete cascade,
  evidence_id uuid not null references game_content.evidence(id) on delete cascade,
  display_order integer not null default 0 check (display_order >= 0),
  source_type text not null default 'CLUE_UNLOCK' check (source_type = 'CLUE_UNLOCK'),
  created_at timestamptz not null default now(),
  unique (clue_id, evidence_id)
);

create index difficulty_initial_evidence_config_idx
  on game_content.difficulty_initial_evidence (difficulty_config_id, display_order);
create index difficulty_initial_evidence_evidence_idx
  on game_content.difficulty_initial_evidence (evidence_id);
create index difficulty_initial_clues_config_idx
  on game_content.difficulty_initial_clues (difficulty_config_id, display_order);
create index difficulty_initial_clues_clue_idx
  on game_content.difficulty_initial_clues (clue_id);
create index clue_evidence_unlocks_clue_idx
  on game_content.clue_evidence_unlocks (clue_id, display_order);
create index clue_evidence_unlocks_evidence_idx
  on game_content.clue_evidence_unlocks (evidence_id);

alter table game_content.difficulty_initial_evidence enable row level security;
alter table game_content.difficulty_initial_clues enable row level security;
alter table game_content.clue_evidence_unlocks enable row level security;

revoke all on table game_content.difficulty_initial_evidence from public, anon, authenticated;
revoke all on table game_content.difficulty_initial_clues from public, anon, authenticated;
revoke all on table game_content.clue_evidence_unlocks from public, anon, authenticated;
grant all on table game_content.difficulty_initial_evidence to service_role;
grant all on table game_content.difficulty_initial_clues to service_role;
grant all on table game_content.clue_evidence_unlocks to service_role;

create function game_private.validate_progression_mapping_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'difficulty_initial_evidence' and not exists (
    select 1
    from game_content.episode_difficulty_configs as config
    join game_content.evidence as evidence
      on evidence.id = (to_jsonb(new) ->> 'evidence_id')::uuid
    where config.id = (to_jsonb(new) ->> 'difficulty_config_id')::uuid
      and config.episode_id = evidence.episode_id
  ) then
    raise exception 'DIFFICULTY_INITIAL_EVIDENCE_EPISODE_MISMATCH' using errcode = '23514';
  elsif tg_table_name = 'difficulty_initial_clues' and not exists (
    select 1
    from game_content.episode_difficulty_configs as config
    join game_content.clues as clue
      on clue.id = (to_jsonb(new) ->> 'clue_id')::uuid
    where config.id = (to_jsonb(new) ->> 'difficulty_config_id')::uuid
      and config.episode_id = clue.episode_id
  ) then
    raise exception 'DIFFICULTY_INITIAL_CLUE_EPISODE_MISMATCH' using errcode = '23514';
  elsif tg_table_name = 'clue_evidence_unlocks' and not exists (
    select 1
    from game_content.clues as clue
    join game_content.evidence as evidence
      on evidence.id = (to_jsonb(new) ->> 'evidence_id')::uuid
    where clue.id = (to_jsonb(new) ->> 'clue_id')::uuid
      and clue.episode_id = evidence.episode_id
  ) then
    raise exception 'CLUE_EVIDENCE_EPISODE_MISMATCH' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger validate_difficulty_initial_evidence_scope
before insert or update on game_content.difficulty_initial_evidence
for each row execute function game_private.validate_progression_mapping_scope();
create trigger validate_difficulty_initial_clues_scope
before insert or update on game_content.difficulty_initial_clues
for each row execute function game_private.validate_progression_mapping_scope();
create trigger validate_clue_evidence_unlocks_scope
before insert or update on game_content.clue_evidence_unlocks
for each row execute function game_private.validate_progression_mapping_scope();

revoke all on function game_private.validate_progression_mapping_scope() from public, anon, authenticated;

insert into game_content.clues (
  id, episode_id, code, title, content, clue_type, importance, record_summary,
  supports_culprit_id, source_refs, excludes_suspect_refs, is_repeatable,
  is_required_for_full_resolution, display_order
)
select
  '00000004-0000-4000-8000-000000000196'::uuid,
  episode.id,
  'JJ-01-C7',
  '찻잔의 백색 분말 흔적',
  '피해자의 전용 찻잔에서 일반 찻잎과 다른 백색 분말 흔적이 발견됐다.',
  'PHYSICAL',
  'SUPPORT',
  '찻잔에 일반 찻잎과 다른 백색 분말이 남아 있어 독성 물질 가능성을 조사해야 한다.',
  null,
  '[]'::jsonb,
  '[]'::jsonb,
  false,
  false,
  7
from game_content.episodes as episode
where episode.code = 'JJ-01'
on conflict (code) do update set
  title = excluded.title,
  content = excluded.content,
  clue_type = excluded.clue_type,
  importance = excluded.importance,
  record_summary = excluded.record_summary,
  supports_culprit_id = null,
  is_required_for_full_resolution = false,
  display_order = excluded.display_order,
  updated_at = now();

with mappings(episode_code, difficulty, evidence_code, display_order) as (
  values
    ('GS-01','easy','GS-01-E1',1), ('GS-01','easy','GS-01-E3',2), ('GS-01','easy','GS-01-E4',3),
    ('GS-01','normal','GS-01-E1',1), ('GS-01','normal','GS-01-E3',2), ('GS-01','hard','GS-01-E1',1),
    ('JL-01','easy','JL-01-E1',1), ('JL-01','easy','JL-01-E3',2), ('JL-01','easy','JL-01-E2',3),
    ('JL-01','normal','JL-01-E1',1), ('JL-01','normal','JL-01-E3',2), ('JL-01','hard','JL-01-E1',1),
    ('CC-01','easy','CC-01-E1',1), ('CC-01','easy','CC-01-E2',2), ('CC-01','easy','CC-01-E3',3),
    ('CC-01','normal','CC-01-E1',1), ('CC-01','normal','CC-01-E2',2), ('CC-01','hard','CC-01-E1',1),
    ('JJ-01','easy','JJ-01-E1',1), ('JJ-01','easy','JJ-01-E2',2), ('JJ-01','easy','JJ-01-E4',3),
    ('JJ-01','normal','JJ-01-E1',1), ('JJ-01','normal','JJ-01-E2',2), ('JJ-01','hard','JJ-01-E1',1)
)
insert into game_content.difficulty_initial_evidence (difficulty_config_id, evidence_id, display_order)
select config.id, evidence.id, mappings.display_order
from mappings
join game_content.episodes as episode on episode.code = mappings.episode_code
join game_content.episode_difficulty_configs as config
  on config.episode_id = episode.id and config.difficulty = mappings.difficulty
join game_content.evidence as evidence
  on evidence.episode_id = episode.id and evidence.code = mappings.evidence_code
on conflict (difficulty_config_id, evidence_id) do update
set display_order = excluded.display_order;

with mappings(episode_code, clue_code, display_order) as (
  values ('GS-01','GS-01-C1',1), ('JL-01','JL-01-C1',1),
         ('CC-01','CC-01-C1',1), ('JJ-01','JJ-01-C7',1)
)
insert into game_content.difficulty_initial_clues (difficulty_config_id, clue_id, display_order)
select config.id, clue.id, mappings.display_order
from mappings
join game_content.episodes as episode on episode.code = mappings.episode_code
join game_content.episode_difficulty_configs as config
  on config.episode_id = episode.id and config.difficulty = 'easy'
join game_content.clues as clue
  on clue.episode_id = episode.id and clue.code = mappings.clue_code
on conflict (difficulty_config_id, clue_id) do update
set display_order = excluded.display_order;

with mappings(clue_code, evidence_code, display_order) as (
  values
    ('GS-01-C4','GS-01-E5',1), ('GS-01-C2','GS-01-E4',1), ('GS-01-C3','GS-01-E2',1),
    ('JL-01-C1','JL-01-E3',1), ('JL-01-C2','JL-01-E6',1), ('JL-01-C3','JL-01-E5',1),
    ('CC-01-C3','CC-01-E2',1), ('CC-01-C4','CC-01-E4',1), ('CC-01-C5','CC-01-E3',1),
    ('JJ-01-C1','JJ-01-E6',1), ('JJ-01-C2','JJ-01-E4',1),
    ('JJ-01-C3','JJ-01-E3',1), ('JJ-01-C5','JJ-01-E5',1)
)
insert into game_content.clue_evidence_unlocks (clue_id, evidence_id, display_order)
select clue.id, evidence.id, mappings.display_order
from mappings
join game_content.clues as clue on clue.code = mappings.clue_code
join game_content.evidence as evidence
  on evidence.code = mappings.evidence_code and evidence.episode_id = clue.episode_id
on conflict (clue_id, evidence_id) do update
set display_order = excluded.display_order;

with desired(fact_code, question_type) as (
  values
    ('GS-01-S2-FACT','Q-EVIDENCE'), ('GS-01-S2-FACT','Q-CONTRADICTION'),
    ('GS-01-S3-FACT','Q-TIME'), ('GS-01-S3-FACT','Q-EVIDENCE'),
    ('JL-01-S2-FACT-SECRET','Q-TIME'), ('JL-01-S2-FACT-SECRET','Q-EVIDENCE'),
    ('JL-01-S2-FACT-EVIDENCE','Q-EVIDENCE'), ('JL-01-S2-FACT-EVIDENCE','Q-RELATION'),
    ('JL-01-S3-FACT','Q-TIME'), ('JL-01-S3-FACT','Q-RELATION'),
    ('CC-01-S1-FACT','Q-TIME'), ('CC-01-S1-FACT','Q-PLACE'),
    ('CC-01-S3-FACT','Q-TIME'), ('CC-01-S3-FACT','Q-EVIDENCE'),
    ('CC-01-S3-FACT-EVIDENCE','Q-TIME'), ('CC-01-S3-FACT-EVIDENCE','Q-EVIDENCE'),
    ('CC-01-S3-FACT-SECRET','Q-EVIDENCE'), ('CC-01-S3-FACT-SECRET','Q-CONTRADICTION'),
    ('CC-01-S4-FACT','Q-EVIDENCE'), ('CC-01-S4-FACT','Q-CONTRADICTION'),
    ('JJ-01-S1-FACT','Q-TIME'), ('JJ-01-S1-FACT','Q-PLACE'),
    ('JJ-01-S3-FACT','Q-TIME'), ('JJ-01-S3-FACT','Q-EVIDENCE'),
    ('JJ-01-S3-FACT-EVIDENCE','Q-TIME'), ('JJ-01-S3-FACT-EVIDENCE','Q-EVIDENCE'),
    ('JJ-01-S4-FACT','Q-EVIDENCE'), ('JJ-01-S4-FACT','Q-CONTRADICTION')
), targets as (
  select fact.id as fact_id, fact.code as fact_code, fact.suspect_id, desired.question_type
  from desired join game_content.suspect_facts as fact on fact.code = desired.fact_code
), rule_targets as (
  select rule.id,
    jsonb_agg(distinct targets.fact_id::text) as fact_ids,
    array_agg(distinct targets.fact_code) as fact_codes
  from targets
  join game_content.suspect_response_rules as rule
    on rule.suspect_id = targets.suspect_id and rule.question_type = targets.question_type
  group by rule.id
), updated as (
  select rule.id,
    (
      select coalesce(jsonb_agg(value order by value), '[]'::jsonb)
      from (
        select distinct value
        from jsonb_array_elements_text(coalesce(rule.allowed_fact_refs, '[]'::jsonb)) as existing(value)
        union
        select value from jsonb_array_elements_text(rule_targets.fact_ids) as desired(value)
      ) as allowed_values
    ) as allowed_fact_refs,
    (
      select coalesce(jsonb_agg(value order by value), '[]'::jsonb)
      from (
        select distinct value
        from jsonb_array_elements_text(coalesce(rule.hidden_fact_refs, '[]'::jsonb)) as existing(value)
        where not (rule_targets.fact_ids ? value)
          and not (value = any(rule_targets.fact_codes))
      ) as hidden_values
    ) as hidden_fact_refs
  from rule_targets
  join game_content.suspect_response_rules as rule on rule.id = rule_targets.id
)
update game_content.suspect_response_rules as rule
set allowed_fact_refs = updated.allowed_fact_refs,
    hidden_fact_refs = updated.hidden_fact_refs,
    updated_at = now()
from updated
where rule.id = updated.id;

with redundant(clue_code, fact_code) as (
  values
    ('CC-01-C2','CC-01-S1-FACT-ALIBI'),
    ('CC-01-C3','CC-01-S3-FACT-EVIDENCE'),
    ('JJ-01-C1','JJ-01-S1-FACT-ALIBI'),
    ('JJ-01-C2','JJ-01-S3-FACT-EVIDENCE')
)
delete from game_content.clue_unlock_conditions as condition
using game_content.clues as clue, game_content.suspect_facts as fact, redundant
where condition.clue_id = clue.id
  and clue.code = redundant.clue_code
  and fact.code = redundant.fact_code
  and condition.condition_type = 'FACT_REVEALED'
  and condition.target_ref in (fact.id::text, fact.code);

create function game_private.evaluate_clue_unlocks_with_evidence(
  p_session_id uuid,
  p_source text default 'SERVER',
  p_current_message_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_batch uuid[];
  v_new_clue_ids uuid[] := array[]::uuid[];
  v_new_evidence_ids uuid[] := array[]::uuid[];
  v_evidence_batch uuid[];
begin
  loop
    with eligible as (
      select clue.id
      from public.game_sessions as session
      join game_content.clues as clue on clue.episode_id = session.episode_id
      where session.id = p_session_id
        and not exists (
          select 1 from public.session_clues as acquired
          where acquired.session_id = p_session_id and acquired.clue_id = clue.id
        )
        and exists (
          select 1 from game_content.clue_unlock_conditions as condition
          where condition.clue_id = clue.id
        )
        and exists (
          select 1
          from (
            select condition.group_no,
              bool_and(game_private.clue_condition_is_met(
                p_session_id, condition.id, p_current_message_id
              )) as satisfied
            from game_content.clue_unlock_conditions as condition
            where condition.clue_id = clue.id
            group by condition.group_no
          ) as condition_group
          where condition_group.satisfied
        )
    ), inserted as (
      insert into public.session_clues (
        session_id, clue_id, acquired_from_type, acquired_from_ref, acquired_at
      )
      select p_session_id, eligible.id, left(coalesce(p_source, 'SERVER'), 100),
        p_current_message_id::text, now()
      from eligible
      on conflict (session_id, clue_id) do nothing
      returning clue_id
    )
    select coalesce(array_agg(inserted.clue_id), array[]::uuid[])
    into v_batch
    from inserted;

    exit when cardinality(v_batch) = 0;
    v_new_clue_ids := v_new_clue_ids || v_batch;

    with inserted_evidence as (
      insert into public.session_evidence (session_id, evidence_id, source_type, viewed_at)
      select distinct p_session_id, unlock.evidence_id, unlock.source_type, null
      from game_content.clue_evidence_unlocks as unlock
      join public.game_sessions as session on session.id = p_session_id
      join game_content.evidence as evidence
        on evidence.id = unlock.evidence_id and evidence.episode_id = session.episode_id
      where unlock.clue_id = any(v_batch)
      on conflict (session_id, evidence_id) do nothing
      returning evidence_id
    )
    select coalesce(array_agg(inserted_evidence.evidence_id), array[]::uuid[])
    into v_evidence_batch
    from inserted_evidence;

    v_new_evidence_ids := v_new_evidence_ids || v_evidence_batch;
  end loop;

  return jsonb_build_object(
    'newClueIds', to_jsonb(v_new_clue_ids),
    'newEvidenceIds', to_jsonb(v_new_evidence_ids)
  );
end;
$$;

create or replace function game_private.evaluate_clue_unlocks(
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
  v_result jsonb;
begin
  v_result := game_private.evaluate_clue_unlocks_with_evidence(
    p_session_id, p_source, p_current_message_id
  );
  return coalesce(
    array(
      select value::uuid
      from jsonb_array_elements_text(v_result -> 'newClueIds') as clue(value)
    ),
    array[]::uuid[]
  );
end;
$$;

create or replace function public.initialize_game_session(
  p_user_id uuid,
  p_episode_id uuid,
  p_difficulty text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config game_content.episode_difficulty_configs%rowtype;
  v_session_id uuid;
  v_now timestamptz := clock_timestamp();
begin
  if not exists (
    select 1 from game_content.episodes as episode
    where episode.id = p_episode_id and episode.status = 'published'
  ) then raise exception 'EPISODE_NOT_FOUND' using errcode = 'P0001'; end if;

  select config.* into v_config
  from game_content.episode_difficulty_configs as config
  where config.episode_id = p_episode_id and config.difficulty = p_difficulty;
  if not found then raise exception 'EPISODE_DIFFICULTY_NOT_FOUND' using errcode = 'P0001'; end if;

  insert into public.game_sessions (
    user_id, episode_id, difficulty_config_id, status, started_at, expires_at,
    remaining_questions, last_activity_at
  ) values (
    p_user_id, p_episode_id, v_config.id, 'CREATED', v_now,
    v_now + make_interval(secs => v_config.time_limit_seconds),
    v_config.total_questions, v_now
  ) returning id into v_session_id;

  insert into public.session_suspect_states (
    session_id, suspect_id, current_emotion, questions_used,
    interrogation_status, last_interrogated_at
  )
  select v_session_id, suspect.id, suspect.initial_emotion, 0, 'AVAILABLE', null
  from game_content.suspects as suspect
  where suspect.episode_id = p_episode_id and suspect.is_active;

  insert into public.session_evidence (session_id, evidence_id, source_type, viewed_at)
  select v_session_id, initial.evidence_id, 'INITIAL', null
  from game_content.difficulty_initial_evidence as initial
  join game_content.evidence as evidence on evidence.id = initial.evidence_id
  where initial.difficulty_config_id = v_config.id
    and evidence.episode_id = p_episode_id
  order by initial.display_order
  on conflict (session_id, evidence_id) do nothing;

  insert into public.session_clues (
    session_id, clue_id, acquired_from_type, acquired_from_ref, acquired_at
  )
  select v_session_id, initial.clue_id, 'INITIAL_DIFFICULTY', v_config.id::text, v_now
  from game_content.difficulty_initial_clues as initial
  join game_content.clues as clue on clue.id = initial.clue_id
  where initial.difficulty_config_id = v_config.id
    and clue.episode_id = p_episode_id
  order by initial.display_order
  on conflict (session_id, clue_id) do nothing;

  insert into public.user_episode_progress (
    user_id, episode_id, state, last_played_at, unlocked_at, updated_at
  ) values (p_user_id, p_episode_id, 'IN_PROGRESS', v_now, v_now, v_now)
  on conflict (user_id, episode_id) do update
    set state = 'IN_PROGRESS', last_played_at = excluded.last_played_at,
        unlocked_at = coalesce(public.user_episode_progress.unlocked_at, excluded.unlocked_at),
        updated_at = excluded.updated_at;

  return v_session_id;
end;
$$;

create or replace function public.finalize_interrogation(
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
  v_unlock_result jsonb;
begin
  select session.* into v_session from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id for update;
  if not found then raise exception 'INTERROGATION_SESSION_NOT_FOUND' using errcode = 'P0001'; end if;

  select message.* into v_existing from public.interrogation_messages as message
  where message.request_id = p_request_id;
  if found then
    if v_existing.session_id <> p_session_id then
      raise exception 'INTERROGATION_REQUEST_ID_CONFLICT' using errcode = 'P0001';
    end if;
    return jsonb_build_object(
      'duplicate', true, 'message', to_jsonb(v_existing),
      'newClueIds', '[]'::jsonb, 'newEvidenceIds', '[]'::jsonb,
      'remainingQuestions', v_session.remaining_questions
    );
  end if;

  if v_session.status <> 'INTERROGATING' then raise exception 'INTERROGATION_STATE_INVALID' using errcode = 'P0001'; end if;
  if v_session.expires_at <= now() then raise exception 'INTERROGATION_SESSION_EXPIRED' using errcode = 'P0001'; end if;
  if v_session.remaining_questions <= 0 then raise exception 'INTERROGATION_QUESTIONS_EXHAUSTED' using errcode = 'P0001'; end if;
  if v_session.current_suspect_id is distinct from p_suspect_id then raise exception 'INTERROGATION_SUSPECT_NOT_SELECTED' using errcode = 'P0001'; end if;
  if char_length(btrim(p_question)) not between 2 and 500
     or char_length(btrim(p_dialect_response)) not between 2 and 500
     or p_consistency_status not in ('valid', 'invalid')
  then raise exception 'INTERROGATION_PAYLOAD_INVALID' using errcode = 'P0001'; end if;

  if exists (
    select 1 from unnest(coalesce(p_presented_evidence_ids, array[]::uuid[])) as presented(evidence_id)
    where not exists (
      select 1 from public.session_evidence as available
      join game_content.evidence as evidence on evidence.id = available.evidence_id
      where available.session_id = p_session_id
        and available.evidence_id = presented.evidence_id
        and evidence.episode_id = v_session.episode_id
    )
  ) then raise exception 'INTERROGATION_EVIDENCE_NOT_AVAILABLE' using errcode = 'P0001'; end if;

  if exists (
    select 1
    from unnest(
      coalesce(p_used_fact_ids, array[]::uuid[])
      || coalesce(p_revealed_fact_ids, array[]::uuid[])
      || coalesce(p_claimed_fact_ids, array[]::uuid[])
    ) as referenced(fact_id)
    where not exists (
      select 1 from game_content.suspect_facts as fact
      where fact.id = referenced.fact_id
        and fact.suspect_id = p_suspect_id
        and fact.disclosure_level <> 'SERVER_ONLY'
        and (
          fact.disclosure_level = 'LLM_ALLOWED'
          or exists (
            select 1 from game_content.suspect_response_rules as rule
            where rule.suspect_id = p_suspect_id
              and rule.question_type = p_question_type
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
  where config.id = v_session.difficulty_config_id
    and config.episode_id = v_session.episode_id;
  if v_state.questions_used >= v_questions_per_suspect then
    raise exception 'INTERROGATION_SUSPECT_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  insert into public.interrogation_messages (
    session_id, suspect_id, request_id, user_question, question_type, npc_response,
    emotion_before, emotion_after, evasion_type, used_fact_refs, revealed_fact_refs,
    claimed_fact_refs, presented_evidence_refs, question_cost, response_metadata
  ) values (
    p_session_id, p_suspect_id, p_request_id, btrim(p_question), p_question_type,
    btrim(p_dialect_response), v_state.current_emotion, p_emotion, p_evasion_type,
    to_jsonb(coalesce(p_used_fact_ids, array[]::uuid[])),
    to_jsonb(coalesce(p_revealed_fact_ids, array[]::uuid[])),
    to_jsonb(coalesce(p_claimed_fact_ids, array[]::uuid[])),
    to_jsonb(coalesce(p_presented_evidence_ids, array[]::uuid[])), 1,
    coalesce(p_response_metadata, '{}'::jsonb)
      || jsonb_build_object('characterConsistencyStatus', p_consistency_status)
  ) returning * into v_message;

  update public.game_sessions
  set remaining_questions = remaining_questions - 1,
      last_activity_at = now(), updated_at = now()
  where id = p_session_id
  returning remaining_questions into v_session.remaining_questions;

  update public.session_suspect_states
  set current_emotion = p_emotion,
      questions_used = questions_used + 1,
      interrogation_status = case
        when questions_used + 1 >= v_questions_per_suspect then 'EXHAUSTED'
        else 'AVAILABLE'
      end,
      last_interrogated_at = now(), updated_at = now()
  where id = v_state.id;

  v_unlock_result := game_private.evaluate_clue_unlocks_with_evidence(
    p_session_id, 'INTERROGATION', v_message.id
  );
  return jsonb_build_object(
    'duplicate', false, 'message', to_jsonb(v_message),
    'newClueIds', v_unlock_result -> 'newClueIds',
    'newEvidenceIds', v_unlock_result -> 'newEvidenceIds',
    'remainingQuestions', v_session.remaining_questions
  );
end;
$$;

create or replace function public.view_session_evidence(
  p_user_id uuid,
  p_session_id uuid,
  p_evidence_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.game_sessions%rowtype;
  v_viewed_at timestamptz;
  v_unlock_result jsonb;
begin
  select session.* into v_session
  from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id
  for update;
  if not found then raise exception 'CLUE_SESSION_NOT_FOUND' using errcode = 'P0001'; end if;

  if not exists (
    select 1 from game_content.evidence as evidence
    where evidence.id = p_evidence_id and evidence.episode_id = v_session.episode_id
  ) then raise exception 'EVIDENCE_NOT_IN_EPISODE' using errcode = 'P0001'; end if;

  if not exists (
    select 1 from public.session_evidence as available
    where available.session_id = p_session_id and available.evidence_id = p_evidence_id
  ) then raise exception 'EVIDENCE_NOT_AVAILABLE' using errcode = 'P0001'; end if;

  update public.session_evidence
  set viewed_at = coalesce(viewed_at, now())
  where session_id = p_session_id and evidence_id = p_evidence_id
  returning viewed_at into v_viewed_at;

  update public.game_sessions
  set last_activity_at = now(), updated_at = now()
  where id = p_session_id;

  v_unlock_result := game_private.evaluate_clue_unlocks_with_evidence(
    p_session_id, 'EVIDENCE_VIEWED', null
  );
  return jsonb_build_object(
    'evidenceId', p_evidence_id,
    'viewedAt', v_viewed_at,
    'newClueIds', v_unlock_result -> 'newClueIds',
    'newEvidenceIds', v_unlock_result -> 'newEvidenceIds'
  );
end;
$$;

revoke all on function game_private.evaluate_clue_unlocks_with_evidence(uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function game_private.evaluate_clue_unlocks(uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.initialize_game_session(uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.finalize_interrogation(
  uuid, uuid, uuid, uuid, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], text, text, jsonb
) from public, anon, authenticated;
revoke all on function public.view_session_evidence(uuid, uuid, uuid)
  from public, anon, authenticated;

grant execute on function game_private.evaluate_clue_unlocks_with_evidence(uuid, text, uuid)
  to service_role;
grant execute on function game_private.evaluate_clue_unlocks(uuid, text, uuid)
  to service_role;
grant execute on function public.initialize_game_session(uuid, uuid, text)
  to service_role;
grant execute on function public.finalize_interrogation(
  uuid, uuid, uuid, uuid, text, text, text, text,
  uuid[], uuid[], uuid[], uuid[], text, text, jsonb
) to service_role;
grant execute on function public.view_session_evidence(uuid, uuid, uuid)
  to service_role;


