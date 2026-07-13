alter table public.session_evidence
  add column if not exists viewed_at timestamptz;

alter table game_content.clue_unlock_conditions
  add column if not exists group_no integer not null default 1,
  add column if not exists operator text not null default 'EXISTS';

update game_content.clue_unlock_conditions
set condition_type = case lower(condition_type)
  when 'evidence_discovered' then 'EVIDENCE_VIEWED'
  when 'fact_revealed' then 'FACT_USED'
  when 'interrogation_fact' then 'FACT_USED'
  else upper(condition_type)
end;

update game_content.clue_unlock_conditions
set operator = 'EQ'
where condition_data ?| array['evidence_id','question_type','fact_id','clue_id','suspect_id','emotion'];

alter table game_content.clue_unlock_conditions
  add constraint clue_unlock_conditions_group_no_check check (group_no > 0),
  add constraint clue_unlock_conditions_type_check check (condition_type in (
    'EVIDENCE_VIEWED','QUESTION_TYPE_ASKED','FACT_USED','CLUE_ACQUIRED',
    'SUSPECT_INTERROGATED','MESSAGE_EXISTS','EMOTION_REACHED'
  )),
  add constraint clue_unlock_conditions_operator_check check (operator in ('EQ','IN','GTE','EXISTS'));

create index if not exists clue_unlock_conditions_clue_group_idx
  on game_content.clue_unlock_conditions (clue_id, group_no);
create index if not exists session_evidence_viewed_idx
  on public.session_evidence (session_id, evidence_id)
  where viewed_at is not null;

create or replace function game_private.clue_condition_is_met(
  p_session_id uuid,
  p_condition_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_condition game_content.clue_unlock_conditions%rowtype;
  v_target text;
  v_values jsonb;
  v_threshold integer;
  v_measure bigint := 0;
begin
  select condition.* into v_condition
  from game_content.clue_unlock_conditions as condition
  where condition.id = p_condition_id;
  if not found then return false; end if;

  v_values := coalesce(
    v_condition.condition_data -> 'values',
    v_condition.condition_data -> 'evidence_ids',
    v_condition.condition_data -> 'question_types',
    v_condition.condition_data -> 'fact_ids',
    v_condition.condition_data -> 'clue_ids',
    v_condition.condition_data -> 'suspect_ids',
    v_condition.condition_data -> 'emotions',
    '[]'::jsonb
  );
  v_threshold := greatest(coalesce(
    nullif(v_condition.condition_data ->> 'value', '')::integer,
    nullif(v_condition.condition_data ->> 'threshold', '')::integer,
    1
  ), 0);

  if v_condition.condition_type = 'EVIDENCE_VIEWED' then
    v_target := coalesce(v_condition.condition_data ->> 'evidence_id', v_condition.condition_data ->> 'target_id');
    select count(*) into v_measure
    from public.session_evidence as evidence
    where evidence.session_id = p_session_id
      and evidence.viewed_at is not null
      and case v_condition.operator
        when 'IN' then v_values ? evidence.evidence_id::text
        when 'GTE' then true
        else v_target is null or evidence.evidence_id::text = v_target
      end;

  elsif v_condition.condition_type = 'QUESTION_TYPE_ASKED' then
    v_target := coalesce(v_condition.condition_data ->> 'question_type', v_condition.condition_data ->> 'target');
    select count(*) into v_measure
    from public.interrogation_messages as message
    where message.session_id = p_session_id and message.status = 'completed'
      and case v_condition.operator
        when 'IN' then v_values ? (message.response_metadata ->> 'questionType')
        else v_target is null or message.response_metadata ->> 'questionType' = v_target
      end;

  elsif v_condition.condition_type = 'FACT_USED' then
    v_target := coalesce(v_condition.condition_data ->> 'fact_id', v_condition.condition_data ->> 'target_id');
    select count(distinct used_fact.fact_id) into v_measure
    from public.interrogation_messages as message
    cross join lateral jsonb_array_elements_text(
      coalesce(message.response_metadata -> 'usedFactIds', '[]'::jsonb)
    ) as used_fact(fact_id)
    where message.session_id = p_session_id and message.status = 'completed'
      and case v_condition.operator
        when 'IN' then v_values ? used_fact.fact_id
        when 'GTE' then v_target is null or used_fact.fact_id = v_target
        else v_target is null or used_fact.fact_id = v_target
      end;

  elsif v_condition.condition_type = 'CLUE_ACQUIRED' then
    v_target := coalesce(v_condition.condition_data ->> 'clue_id', v_condition.condition_data ->> 'target_id');
    select count(*) into v_measure
    from public.session_clues as acquired
    where acquired.session_id = p_session_id
      and case v_condition.operator
        when 'IN' then v_values ? acquired.clue_id::text
        when 'GTE' then true
        else v_target is null or acquired.clue_id::text = v_target
      end;

  elsif v_condition.condition_type = 'SUSPECT_INTERROGATED' then
    v_target := coalesce(v_condition.condition_data ->> 'suspect_id', v_condition.condition_data ->> 'target_id');
    select count(*) into v_measure
    from public.interrogation_messages as message
    where message.session_id = p_session_id and message.status = 'completed'
      and case v_condition.operator
        when 'IN' then v_values ? message.suspect_id::text
        else v_target is null or message.suspect_id::text = v_target
      end;

  elsif v_condition.condition_type = 'MESSAGE_EXISTS' then
    v_target := v_condition.condition_data ->> 'suspect_id';
    select count(*) into v_measure
    from public.interrogation_messages as message
    where message.session_id = p_session_id and message.status = 'completed'
      and case v_condition.operator
        when 'IN' then v_values ? message.suspect_id::text
        else v_target is null or message.suspect_id::text = v_target
      end;

  elsif v_condition.condition_type = 'EMOTION_REACHED' then
    v_target := v_condition.condition_data ->> 'suspect_id';
    if v_condition.operator = 'GTE' then
      select coalesce(max(state.emotion_intensity), 0) into v_measure
      from public.session_suspect_states as state
      where state.session_id = p_session_id
        and (v_target is null or state.suspect_id::text = v_target)
        and (v_condition.condition_data ->> 'emotion' is null or state.emotion = v_condition.condition_data ->> 'emotion');
    else
      select count(*) into v_measure
      from public.session_suspect_states as state
      where state.session_id = p_session_id
        and (v_target is null or state.suspect_id::text = v_target)
        and case v_condition.operator
          when 'IN' then v_values ? state.emotion
          else v_condition.condition_data ->> 'emotion' is null or state.emotion = v_condition.condition_data ->> 'emotion'
        end;
    end if;
  end if;

  if v_condition.operator = 'GTE' then return v_measure >= v_threshold; end if;
  return v_measure > 0;
end;
$$;

create or replace function game_private.evaluate_clue_unlocks(
  p_session_id uuid,
  p_source text default 'SERVER'
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
              bool_and(game_private.clue_condition_is_met(p_session_id, condition.id)) as group_satisfied
            from game_content.clue_unlock_conditions as condition
            where condition.clue_id = clue.id
            group by condition.group_no
          ) as condition_group
          where condition_group.group_satisfied
        )
    ), inserted as (
      insert into public.session_clues (session_id, clue_id, source)
      select p_session_id, eligible.id, left(coalesce(p_source, 'SERVER'), 50)
      from eligible
      on conflict (session_id, clue_id) do nothing
      returning clue_id
    )
    select coalesce(array_agg(inserted.clue_id), array[]::uuid[]) into v_batch
    from inserted;

    exit when cardinality(v_batch) = 0;
    v_unlocked := v_unlocked || v_batch;
  end loop;
  return v_unlocked;
end;
$$;

create or replace function game_private.evaluate_interrogation_clues(
  p_session_id uuid,
  p_suspect_id uuid,
  p_used_fact_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform game_private.evaluate_clue_unlocks(p_session_id, 'INTERROGATION');
end;
$$;

create or replace function public.evaluate_session_clues(
  p_user_id uuid,
  p_session_id uuid,
  p_source text default 'SERVER'
)
returns uuid[]
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.game_sessions as session
    where session.id = p_session_id and session.user_id = p_user_id
  ) then
    raise exception 'CLUE_SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;
  return game_private.evaluate_clue_unlocks(p_session_id, p_source);
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
  v_new_clue_ids uuid[];
begin
  select session.* into v_session
  from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id
  for update;
  if not found then raise exception 'CLUE_SESSION_NOT_FOUND' using errcode = 'P0001'; end if;

  if not exists (
    select 1 from game_content.evidence as evidence
    where evidence.id = p_evidence_id and evidence.episode_id = v_session.episode_id
  ) then
    raise exception 'EVIDENCE_NOT_IN_EPISODE' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from public.session_evidence as available
    where available.session_id = p_session_id and available.evidence_id = p_evidence_id
  ) then
    raise exception 'EVIDENCE_NOT_AVAILABLE' using errcode = 'P0001';
  end if;

  update public.session_evidence
  set viewed_at = coalesce(viewed_at, now())
  where session_id = p_session_id and evidence_id = p_evidence_id
  returning viewed_at into v_viewed_at;

  update public.game_sessions set last_activity_at = now() where id = p_session_id;
  v_new_clue_ids := game_private.evaluate_clue_unlocks(p_session_id, 'EVIDENCE_VIEWED');
  return jsonb_build_object(
    'evidenceId', p_evidence_id,
    'viewedAt', v_viewed_at,
    'newClueIds', to_jsonb(v_new_clue_ids)
  );
end;
$$;

revoke all on function game_private.clue_condition_is_met(uuid, uuid) from public, anon, authenticated;
revoke all on function game_private.evaluate_clue_unlocks(uuid, text) from public, anon, authenticated;
revoke all on function game_private.evaluate_interrogation_clues(uuid, uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.evaluate_session_clues(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.view_session_evidence(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.evaluate_session_clues(uuid, uuid, text) to service_role;
grant execute on function public.view_session_evidence(uuid, uuid, uuid) to service_role;
