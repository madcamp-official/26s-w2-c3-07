drop function if exists game_private.clue_condition_is_met(uuid, uuid);
create function game_private.clue_condition_is_met(
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
  v_measure bigint := 0;
  v_threshold bigint := 1;
begin
  select condition.* into v_condition
  from game_content.clue_unlock_conditions as condition
  where condition.id = p_condition_id;

  if not found then return false; end if;

  if v_condition.operator = 'GTE'
     and jsonb_typeof(v_condition.expected_value) = 'number' then
    v_threshold := greatest((v_condition.expected_value #>> '{}')::bigint, 0);
  end if;

  if v_condition.condition_type = 'EVIDENCE_VIEWED' then
    select count(*) into v_measure
    from public.session_evidence as evidence
    where evidence.session_id = p_session_id
      and evidence.viewed_at is not null
      and (
        v_condition.operator = 'GTE'
        or evidence.evidence_id::text = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? evidence.evidence_id::text)
      );
  elsif v_condition.condition_type = 'QUESTION_TYPE_ASKED' then
    select count(*) into v_measure
    from public.interrogation_messages as message
    where message.session_id = p_session_id
      and (
        v_condition.operator = 'GTE'
        or message.question_type = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? message.question_type)
      );
  elsif v_condition.condition_type = 'FACT_USED' then
    select count(distinct fact.fact_id) into v_measure
    from public.interrogation_messages as message
    cross join lateral jsonb_array_elements_text(message.used_fact_refs) as fact(fact_id)
    where message.session_id = p_session_id
      and (
        v_condition.operator = 'GTE'
        or fact.fact_id = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? fact.fact_id)
      );
  elsif v_condition.condition_type = 'CLUE_ACQUIRED' then
    select count(*) into v_measure
    from public.session_clues as acquired
    where acquired.session_id = p_session_id
      and (
        v_condition.operator = 'GTE'
        or acquired.clue_id::text = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? acquired.clue_id::text)
      );
  elsif v_condition.condition_type in ('SUSPECT_INTERROGATED', 'MESSAGE_EXISTS') then
    select count(*) into v_measure
    from public.interrogation_messages as message
    where message.session_id = p_session_id
      and (
        v_condition.operator = 'GTE'
        or v_condition.target_ref is null
        or message.suspect_id::text = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? message.suspect_id::text)
      );
  elsif v_condition.condition_type = 'EMOTION_REACHED' then
    select count(*) into v_measure
    from public.session_suspect_states as state
    where state.session_id = p_session_id
      and (
        v_condition.operator = 'GTE'
        or state.current_emotion = v_condition.target_ref
        or (v_condition.operator = 'IN' and v_condition.expected_value ? state.current_emotion)
      );
  end if;

  if v_condition.operator = 'GTE' then return v_measure >= v_threshold; end if;
  return v_measure > 0;
end;
$$;

drop function if exists game_private.evaluate_clue_unlocks(uuid, text);
create function game_private.evaluate_clue_unlocks(
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
          select 1
          from game_content.clue_unlock_conditions as condition
          where condition.clue_id = clue.id
        )
        and exists (
          select 1
          from (
            select condition.group_no,
                   bool_and(game_private.clue_condition_is_met(p_session_id, condition.id)) as satisfied
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
      select p_session_id, eligible.id, left(coalesce(p_source, 'SERVER'), 100), null, now()
      from eligible
      on conflict (session_id, clue_id) do nothing
      returning clue_id
    )
    select coalesce(array_agg(inserted.clue_id), array[]::uuid[])
    into v_batch
    from inserted;

    exit when cardinality(v_batch) = 0;
    v_unlocked := v_unlocked || v_batch;
  end loop;

  return v_unlocked;
end;
$$;

create or replace function public.finalize_interrogation(
  p_user_id uuid,
  p_session_id uuid,
  p_request_id uuid,
  p_suspect_id uuid,
  p_question text,
  p_dialect_response text,
  p_question_type text,
  p_emotion text,
  p_used_fact_ids uuid[],
  p_evasion_type text,
  p_consistency_status text
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
begin
  select session.* into v_session
  from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id
  for update;

  if not found then raise exception 'INTERROGATION_SESSION_NOT_FOUND' using errcode = 'P0001'; end if;

  select message.* into v_existing
  from public.interrogation_messages as message
  where message.request_id = p_request_id;
  if found then
    if v_existing.session_id <> p_session_id then
      raise exception 'INTERROGATION_REQUEST_ID_CONFLICT' using errcode = 'P0001';
    end if;
    return jsonb_build_object('duplicate', true, 'message', to_jsonb(v_existing));
  end if;

  if v_session.status <> 'INTERROGATING' then raise exception 'INTERROGATION_STATE_INVALID' using errcode = 'P0001'; end if;
  if v_session.expires_at <= now() then raise exception 'INTERROGATION_SESSION_EXPIRED' using errcode = 'P0001'; end if;
  if v_session.remaining_questions <= 0 then raise exception 'INTERROGATION_QUESTIONS_EXHAUSTED' using errcode = 'P0001'; end if;
  if v_session.current_suspect_id is distinct from p_suspect_id then
    raise exception 'INTERROGATION_SUSPECT_NOT_SELECTED' using errcode = 'P0001';
  end if;
  if char_length(btrim(p_question)) not between 2 and 500
     or char_length(btrim(p_dialect_response)) not between 2 and 500
     or p_consistency_status not in ('VALID', 'INVALID') then
    raise exception 'INTERROGATION_PAYLOAD_INVALID' using errcode = 'P0001';
  end if;
  if exists (
    select 1
    from unnest(coalesce(p_used_fact_ids, array[]::uuid[])) as used(fact_id)
    where not exists (
      select 1
      from game_content.suspect_facts as fact
      where fact.id = used.fact_id
        and fact.suspect_id = p_suspect_id
        and fact.disclosure_level = 'LLM_ALLOWED'
    )
  ) then
    raise exception 'INTERROGATION_FACT_NOT_ALLOWED' using errcode = 'P0001';
  end if;

  select state.* into v_state
  from public.session_suspect_states as state
  where state.session_id = p_session_id and state.suspect_id = p_suspect_id
  for update;
  if not found then raise exception 'INTERROGATION_SUSPECT_NOT_IN_EPISODE' using errcode = 'P0001'; end if;

  select config.questions_per_suspect into v_questions_per_suspect
  from game_content.episode_difficulty_configs as config
  where config.id = v_session.difficulty_config_id
    and config.episode_id = v_session.episode_id;
  if v_state.questions_used >= v_questions_per_suspect then
    raise exception 'INTERROGATION_SUSPECT_LIMIT_REACHED' using errcode = 'P0001';
  end if;

  insert into public.interrogation_messages (
    session_id, suspect_id, request_id, user_question, question_type,
    npc_response, emotion_before, emotion_after, evasion_type,
    used_fact_refs, question_cost, response_metadata
  ) values (
    p_session_id, p_suspect_id, p_request_id, btrim(p_question), p_question_type,
    btrim(p_dialect_response), v_state.current_emotion, p_emotion, p_evasion_type,
    to_jsonb(coalesce(p_used_fact_ids, array[]::uuid[])), 1,
    jsonb_build_object('consistencyStatus', p_consistency_status)
  ) returning * into v_message;

  update public.game_sessions
  set remaining_questions = remaining_questions - 1,
      last_activity_at = now(),
      updated_at = now()
  where id = p_session_id;

  update public.session_suspect_states
  set current_emotion = p_emotion,
      questions_used = questions_used + 1,
      interrogation_status = case
        when questions_used + 1 >= v_questions_per_suspect then 'EXHAUSTED'
        else 'AVAILABLE'
      end,
      last_interrogated_at = now(),
      updated_at = now()
  where id = v_state.id;

  perform game_private.evaluate_clue_unlocks(p_session_id, 'INTERROGATION');
  return jsonb_build_object('duplicate', false, 'message', to_jsonb(v_message));
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

  update public.game_sessions
  set last_activity_at = now(), updated_at = now()
  where id = p_session_id;

  v_new_clue_ids := game_private.evaluate_clue_unlocks(p_session_id, 'EVIDENCE_VIEWED');
  return jsonb_build_object('evidenceId', p_evidence_id, 'viewedAt', v_viewed_at, 'newClueIds', to_jsonb(v_new_clue_ids));
end;
$$;

alter table public.user_episode_progress
  drop constraint if exists user_episode_progress_best_difficulty_check;
alter table public.user_episode_progress
  add constraint user_episode_progress_best_difficulty_check
  check (best_difficulty is null or best_difficulty in ('easy', 'normal', 'hard'));

create or replace function public.submit_final_deduction(
  p_user_id uuid,
  p_session_id uuid,
  p_suspect_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.game_sessions%rowtype;
  v_culprit_id uuid;
  v_is_correct boolean;
  v_acquired_core integer;
  v_total_core integer;
  v_resolution text;
  v_ending_id uuid;
  v_result_id uuid;
  v_difficulty text;
begin
  select session.* into v_session
  from public.game_sessions as session
  where session.id = p_session_id and session.user_id = p_user_id
  for update;
  if not found then raise exception 'DEDUCTION_SESSION_NOT_FOUND' using errcode = 'P0001'; end if;
  if exists (select 1 from public.game_results where session_id = p_session_id) then
    raise exception 'DEDUCTION_ALREADY_SUBMITTED' using errcode = 'P0001';
  end if;
  if v_session.status in ('COMPLETED', 'ABANDONED', 'EXPIRED', 'ERROR') then
    raise exception 'DEDUCTION_STATE_INVALID' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from game_content.suspects as suspect
    where suspect.id = p_suspect_id and suspect.episode_id = v_session.episode_id
  ) then
    raise exception 'DEDUCTION_SUSPECT_NOT_IN_EPISODE' using errcode = 'P0001';
  end if;

  select episode.culprit_suspect_id into v_culprit_id
  from game_content.episodes as episode
  where episode.id = v_session.episode_id;
  if v_culprit_id is null then raise exception 'DEDUCTION_CULPRIT_NOT_CONFIGURED' using errcode = 'P0001'; end if;

  v_is_correct := p_suspect_id = v_culprit_id;
  select count(*)::integer into v_total_core
  from game_content.clues as clue
  where clue.episode_id = v_session.episode_id and clue.importance = 'CORE';
  select count(*)::integer into v_acquired_core
  from public.session_clues as acquired
  join game_content.clues as clue on clue.id = acquired.clue_id
  where acquired.session_id = p_session_id
    and clue.episode_id = v_session.episode_id
    and clue.importance = 'CORE';

  v_resolution := case
    when v_is_correct and v_acquired_core = v_total_core then 'FULL_RESOLUTION'
    when v_is_correct then 'CULPRIT_CORRECT'
    else 'WRONG_SUSPECT'
  end;

  select ending.id into v_ending_id
  from game_content.endings as ending
  where ending.episode_id = v_session.episode_id
    and (
      (v_is_correct and ending.ending_type = 'TRUE')
      or (not v_is_correct and ending.ending_type = 'WRONG_SPECIFIC' and ending.target_suspect_id = p_suspect_id)
      or (not v_is_correct and ending.ending_type = 'WRONG_FALLBACK')
    )
  order by case
    when v_is_correct and ending.ending_type = 'TRUE' then 0
    when not v_is_correct and ending.ending_type = 'WRONG_SPECIFIC' and ending.target_suspect_id = p_suspect_id then 0
    else 1
  end, ending.display_order
  limit 1;
  if v_ending_id is null then raise exception 'DEDUCTION_ENDING_NOT_FOUND' using errcode = 'P0001'; end if;

  insert into public.game_results (
    session_id, selected_suspect_id, is_correct, resolution_type, ending_id,
    score, acquired_core_clues, total_core_clues, completed_at
  ) values (
    p_session_id, p_suspect_id, v_is_correct, v_resolution, v_ending_id,
    null, v_acquired_core, v_total_core, now()
  ) returning id into v_result_id;

  update public.game_sessions
  set status = 'COMPLETED', completed_at = now(), last_activity_at = now(), updated_at = now()
  where id = p_session_id;

  select config.difficulty into v_difficulty
  from game_content.episode_difficulty_configs as config
  where config.id = v_session.difficulty_config_id;

  insert into public.user_episode_progress (
    user_id, episode_id, state, best_difficulty, first_cleared_at,
    last_played_at, unlocked_at, updated_at
  ) values (
    p_user_id, v_session.episode_id, 'COMPLETED', v_difficulty, now(), now(), now(), now()
  )
  on conflict (user_id, episode_id) do update
  set state = 'COMPLETED',
      best_difficulty = case
        when coalesce(array_position(array['easy','normal','hard'], excluded.best_difficulty), 0)
           > coalesce(array_position(array['easy','normal','hard'], public.user_episode_progress.best_difficulty), 0)
        then excluded.best_difficulty else public.user_episode_progress.best_difficulty
      end,
      first_cleared_at = coalesce(public.user_episode_progress.first_cleared_at, excluded.first_cleared_at),
      last_played_at = excluded.last_played_at,
      unlocked_at = coalesce(public.user_episode_progress.unlocked_at, excluded.unlocked_at),
      updated_at = excluded.updated_at;

  return jsonb_build_object(
    'resultId', v_result_id,
    'selectedSuspectId', p_suspect_id,
    'isCorrect', v_is_correct,
    'resolutionType', v_resolution,
    'acquiredCoreClues', v_acquired_core,
    'totalCoreClues', v_total_core,
    'endingId', v_ending_id
  );
end;
$$;

create or replace function public.claim_ending_report_generation(
  p_user_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result public.game_results%rowtype;
begin
  if not exists (
    select 1 from public.game_sessions as session
    where session.id = p_session_id and session.user_id = p_user_id and session.status = 'COMPLETED'
  ) then
    raise exception 'ENDING_SESSION_NOT_COMPLETED' using errcode = 'P0001';
  end if;

  select result.* into v_result
  from public.game_results as result
  where result.session_id = p_session_id
  for update;
  if not found then raise exception 'ENDING_RESULT_NOT_FOUND' using errcode = 'P0001'; end if;

  if v_result.report_text is not null and v_result.aftermath_text is not null then
    return jsonb_build_object(
      'action', 'REUSE',
      'reportText', v_result.report_text,
      'aftermathText', v_result.aftermath_text,
      'generatedAt', v_result.completed_at
    );
  end if;
  return jsonb_build_object('action', 'GENERATE');
end;
$$;

create or replace function public.complete_ending_report_generation(
  p_user_id uuid,
  p_session_id uuid,
  p_report_text text,
  p_aftermath_text text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result public.game_results%rowtype;
begin
  if not exists (
    select 1 from public.game_sessions as session
    where session.id = p_session_id and session.user_id = p_user_id and session.status = 'COMPLETED'
  ) then
    raise exception 'ENDING_SESSION_NOT_COMPLETED' using errcode = 'P0001';
  end if;
  if char_length(btrim(p_report_text)) not between 1 and 10000
     or char_length(btrim(p_aftermath_text)) not between 1 and 10000 then
    raise exception 'ENDING_REPORT_INVALID' using errcode = 'P0001';
  end if;

  update public.game_results
  set report_text = coalesce(report_text, btrim(p_report_text)),
      aftermath_text = coalesce(aftermath_text, btrim(p_aftermath_text))
  where session_id = p_session_id
  returning * into v_result;
  if not found then raise exception 'ENDING_RESULT_NOT_FOUND' using errcode = 'P0001'; end if;

  return jsonb_build_object(
    'reportText', v_result.report_text,
    'aftermathText', v_result.aftermath_text,
    'generatedAt', v_result.completed_at
  );
end;
$$;

create or replace function public.fail_ending_report_generation(
  p_user_id uuid,
  p_session_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.game_sessions as session
    where session.id = p_session_id and session.user_id = p_user_id
  ) then
    raise exception 'ENDING_SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function game_private.clue_condition_is_met(uuid, uuid) from public, anon, authenticated;
revoke all on function game_private.evaluate_clue_unlocks(uuid, text) from public, anon, authenticated;
revoke all on function public.finalize_interrogation(uuid, uuid, uuid, uuid, text, text, text, text, uuid[], text, text) from public, anon, authenticated;
revoke all on function public.evaluate_session_clues(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.view_session_evidence(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.submit_final_deduction(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function public.claim_ending_report_generation(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_ending_report_generation(uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.fail_ending_report_generation(uuid, uuid) from public, anon, authenticated;

grant execute on function public.finalize_interrogation(uuid, uuid, uuid, uuid, text, text, text, text, uuid[], text, text) to service_role;
grant execute on function public.evaluate_session_clues(uuid, uuid, text) to service_role;
grant execute on function public.view_session_evidence(uuid, uuid, uuid) to service_role;
grant execute on function public.submit_final_deduction(uuid, uuid, uuid) to service_role;
grant execute on function public.claim_ending_report_generation(uuid, uuid) to service_role;
grant execute on function public.complete_ending_report_generation(uuid, uuid, text, text) to service_role;
grant execute on function public.fail_ending_report_generation(uuid, uuid) to service_role;

notify pgrst, 'reload schema';


