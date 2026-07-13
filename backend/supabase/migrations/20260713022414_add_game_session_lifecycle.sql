alter table public.game_sessions drop constraint if exists game_sessions_status_check;
update public.game_sessions set status = case status when 'active' then 'INVESTIGATING' when 'completed' then 'COMPLETED' when 'abandoned' then 'ABANDONED' else upper(status) end;
alter table public.game_sessions
  add column if not exists expires_at timestamptz,
  add column if not exists current_suspect_id uuid references game_content.suspects(id),
  add constraint game_sessions_status_check check (status in ('READY','INVESTIGATING','INTERROGATING','DEDUCTION','COMPLETED','ABANDONED','EXPIRED'));
alter table public.game_sessions alter column status set default 'READY';
update public.game_sessions set expires_at = started_at + interval '15 minutes' where expires_at is null;
alter table public.game_sessions alter column expires_at set not null;

create or replace function public.initialize_game_session(p_user_id uuid, p_episode_id uuid, p_difficulty text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_config game_content.episode_difficulty_configs%rowtype; v_session_id uuid;
begin
  select c.* into v_config from game_content.episode_difficulty_configs c join game_content.episodes e on e.id=c.episode_id
  where c.episode_id=p_episode_id and c.difficulty=p_difficulty and e.is_published=true and e.status='available';
  if not found then raise exception 'EPISODE_DIFFICULTY_NOT_FOUND' using errcode='P0001'; end if;
  insert into public.game_sessions(user_id,episode_id,difficulty_config_id,difficulty,status,remaining_questions,started_at,expires_at)
  values(p_user_id,p_episode_id,v_config.id,p_difficulty,'READY',v_config.total_questions,now(),now()+make_interval(secs=>coalesce(v_config.time_limit_seconds,900))) returning id into v_session_id;
  insert into public.session_suspect_states(session_id,suspect_id,emotion,emotion_intensity,questions_asked,state)
  select v_session_id,s.id,s.initial_emotion,1,0,'{}'::jsonb from game_content.suspects s where s.episode_id=p_episode_id;
  insert into public.session_evidence(session_id,evidence_id) select v_session_id,e.id from game_content.evidence e where e.episode_id=p_episode_id and e.is_initial=true on conflict do nothing;
  insert into public.user_episode_progress(user_id,episode_id,status,play_count,updated_at) values(p_user_id,p_episode_id,'in_progress',1,now())
  on conflict(user_id,episode_id) do update set status='in_progress',play_count=public.user_episode_progress.play_count+1,updated_at=now();
  return v_session_id;
end $$;
revoke all on function public.initialize_game_session(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.initialize_game_session(uuid,uuid,text) to service_role;
