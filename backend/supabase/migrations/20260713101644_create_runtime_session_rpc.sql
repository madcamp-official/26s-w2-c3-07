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
    select 1
    from game_content.episodes as episode
    where episode.id = p_episode_id
      and episode.status = 'published'
  ) then
    raise exception 'EPISODE_NOT_FOUND' using errcode = 'P0001';
  end if;

  select config.*
  into v_config
  from game_content.episode_difficulty_configs as config
  where config.episode_id = p_episode_id
    and config.difficulty = p_difficulty;

  if not found then
    raise exception 'EPISODE_DIFFICULTY_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.game_sessions (
    user_id,
    episode_id,
    difficulty_config_id,
    status,
    started_at,
    expires_at,
    remaining_questions,
    last_activity_at
  ) values (
    p_user_id,
    p_episode_id,
    v_config.id,
    'CREATED',
    v_now,
    v_now + make_interval(secs => v_config.time_limit_seconds),
    v_config.total_questions,
    v_now
  )
  returning id into v_session_id;

  insert into public.session_suspect_states (
    session_id,
    suspect_id,
    current_emotion,
    questions_used,
    interrogation_status,
    last_interrogated_at
  )
  select
    v_session_id,
    suspect.id,
    suspect.initial_emotion,
    0,
    'AVAILABLE',
    null
  from game_content.suspects as suspect
  where suspect.episode_id = p_episode_id
    and suspect.is_active;

  insert into public.session_evidence (
    session_id,
    evidence_id,
    source_type,
    viewed_at
  )
  select
    v_session_id,
    evidence.id,
    'INITIAL',
    v_now
  from game_content.evidence as evidence
  where evidence.episode_id = p_episode_id
    and evidence.initial_visible
  on conflict (session_id, evidence_id) do nothing;

  insert into public.user_episode_progress (
    user_id,
    episode_id,
    state,
    last_played_at,
    unlocked_at,
    updated_at
  ) values (
    p_user_id,
    p_episode_id,
    'IN_PROGRESS',
    v_now,
    v_now,
    v_now
  )
  on conflict (user_id, episode_id) do update
    set state = 'IN_PROGRESS',
        last_played_at = excluded.last_played_at,
        unlocked_at = coalesce(public.user_episode_progress.unlocked_at, excluded.unlocked_at),
        updated_at = excluded.updated_at;

  return v_session_id;
end;
$$;

revoke all on function public.initialize_game_session(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.initialize_game_session(uuid, uuid, text)
  to service_role;

notify pgrst, 'reload schema';
