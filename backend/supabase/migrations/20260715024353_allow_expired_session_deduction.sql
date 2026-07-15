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
  if v_session.status in ('COMPLETED', 'ABANDONED', 'ERROR') then
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

revoke all on function public.submit_final_deduction(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.submit_final_deduction(uuid, uuid, uuid) to service_role;

notify pgrst, 'reload schema';
