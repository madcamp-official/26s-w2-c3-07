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
  v_episode game_content.episodes%rowtype;
  v_existing_result_id uuid;
  v_is_correct boolean;
  v_acquired_core_clues integer;
  v_total_core_clues integer;
  v_resolution_type text;
  v_ending_id uuid;
  v_result_id uuid;
begin
  select session.*
    into v_session
    from public.game_sessions as session
   where session.id = p_session_id
     and session.user_id = p_user_id
   for update;

  if not found then
    raise exception 'DEDUCTION_SESSION_NOT_FOUND' using errcode = 'P0001';
  end if;

  select result.id
    into v_existing_result_id
    from public.game_results as result
   where result.session_id = p_session_id;

  if v_existing_result_id is not null then
    raise exception 'DEDUCTION_ALREADY_SUBMITTED' using errcode = 'P0001';
  end if;

  if v_session.status in ('COMPLETED', 'ABANDONED', 'EXPIRED') then
    raise exception 'DEDUCTION_STATE_INVALID' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
      from game_content.suspects as suspect
     where suspect.id = p_suspect_id
       and suspect.episode_id = v_session.episode_id
  ) then
    raise exception 'DEDUCTION_SUSPECT_NOT_IN_EPISODE' using errcode = 'P0001';
  end if;

  select episode.*
    into v_episode
    from game_content.episodes as episode
   where episode.id = v_session.episode_id;

  if v_episode.culprit_suspect_id is null then
    raise exception 'DEDUCTION_CULPRIT_NOT_CONFIGURED' using errcode = 'P0001';
  end if;

  v_is_correct := p_suspect_id = v_episode.culprit_suspect_id;

  select count(*)::integer
    into v_total_core_clues
    from game_content.clues as clue
   where clue.episode_id = v_session.episode_id
     and clue.clue_type = 'CORE';

  select count(*)::integer
    into v_acquired_core_clues
    from public.session_clues as acquired
    join game_content.clues as clue on clue.id = acquired.clue_id
   where acquired.session_id = p_session_id
     and clue.episode_id = v_session.episode_id
     and clue.clue_type = 'CORE';

  v_resolution_type := case
    when v_is_correct and v_acquired_core_clues = v_total_core_clues then 'FULL_RESOLUTION'
    when v_is_correct then 'CULPRIT_CORRECT'
    else 'WRONG_SUSPECT'
  end;

  if v_is_correct then
    select ending.id
      into v_ending_id
      from game_content.endings as ending
     where ending.episode_id = v_session.episode_id
       and ending.code = v_episode.code || '-TRUE'
     limit 1;
  else
    select ending.id
      into v_ending_id
      from game_content.endings as ending
     where ending.episode_id = v_session.episode_id
       and ending.ending_type = 'incorrect'
       and ending.conditions ->> 'selected_suspect_id' = p_suspect_id::text
     order by ending.sort_order, ending.id
     limit 1;

    if v_ending_id is null then
      insert into game_content.endings (
        episode_id, code, ending_type, title, narrative, conditions, sort_order
      ) values (
        v_session.episode_id,
        v_episode.code || '-WRONG_FALLBACK',
        'incorrect',
        v_episode.title || ' - WRONG_FALLBACK',
        coalesce(v_episode.synopsis, ''),
        jsonb_build_object('fallback', true),
        999
      )
      on conflict (code) do nothing
      returning id into v_ending_id;

      if v_ending_id is null then
        select ending.id
          into v_ending_id
          from game_content.endings as ending
         where ending.code = v_episode.code || '-WRONG_FALLBACK';
      end if;
    end if;
  end if;

  if v_ending_id is null then
    raise exception 'DEDUCTION_ENDING_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.game_results (
    session_id, selected_suspect_id, is_correct, ending_id, result_data
  ) values (
    p_session_id,
    p_suspect_id,
    v_is_correct,
    v_ending_id,
    jsonb_build_object(
      'resolutionType', v_resolution_type,
      'acquiredCoreClues', v_acquired_core_clues,
      'totalCoreClues', v_total_core_clues
    )
  )
  returning id into v_result_id;

  update public.game_sessions
     set status = 'COMPLETED',
         completed_at = now(),
         last_activity_at = now()
   where id = p_session_id;

  insert into public.user_episode_progress (
    user_id, episode_id, status, play_count, completed_at, updated_at
  ) values (
    p_user_id, v_session.episode_id, 'completed', 1, now(), now()
  )
  on conflict (user_id, episode_id) do update
    set status = 'completed',
        completed_at = now(),
        updated_at = now();

  return jsonb_build_object(
    'resultId', v_result_id,
    'selectedSuspectId', p_suspect_id,
    'isCorrect', v_is_correct,
    'resolutionType', v_resolution_type,
    'acquiredCoreClues', v_acquired_core_clues,
    'totalCoreClues', v_total_core_clues,
    'endingId', v_ending_id
  );
end;
$$;

revoke all on function public.submit_final_deduction(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.submit_final_deduction(uuid, uuid, uuid) to service_role;
