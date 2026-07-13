alter table public.user_episode_progress
  add column if not exists best_difficulty text,
  add column if not exists first_cleared_at timestamptz,
  add column if not exists last_played_at timestamptz,
  add column if not exists unlocked_at timestamptz not null default now(),
  add constraint user_episode_progress_best_difficulty_check
    check (best_difficulty is null or best_difficulty in ('easy', 'normal', 'hard'));

update public.user_episode_progress as progress
set first_cleared_at = coalesce(progress.first_cleared_at, progress.completed_at),
    last_played_at = coalesce(progress.last_played_at, progress.completed_at),
    unlocked_at = coalesce((
      select min(session.created_at)
      from public.game_sessions as session
      where session.user_id = progress.user_id
        and session.episode_id = progress.episode_id
    ), progress.unlocked_at)
where progress.completed_at is not null
   or exists (
     select 1 from public.game_sessions as session
     where session.user_id = progress.user_id
       and session.episode_id = progress.episode_id
   );

alter table game_content.dialect_expressions
  add column if not exists episode_id uuid references game_content.episodes(id) on delete cascade;

update game_content.dialect_expressions as expression
set episode_id = candidate.episode_id
from (
  select episode.region_id, min(episode.id::text)::uuid as episode_id
  from game_content.episodes as episode
  group by episode.region_id
  having count(*) = 1
) as candidate
where expression.region_id = candidate.region_id
  and expression.episode_id is null;

create index if not exists game_sessions_user_completed_idx
  on public.game_sessions (user_id, completed_at desc)
  where status = 'COMPLETED';
create index if not exists user_episode_progress_user_last_played_idx
  on public.user_episode_progress (user_id, last_played_at desc);
create index if not exists user_dialect_unlocks_user_unlocked_idx
  on public.user_dialect_unlocks (user_id, unlocked_at desc);
create index if not exists dialect_expressions_episode_id_idx
  on game_content.dialect_expressions (episode_id);

create or replace function public.sync_user_episode_progress_on_completion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result public.game_results%rowtype;
  v_completed_at timestamptz := coalesce(new.completed_at, now());
begin
  if new.status <> 'COMPLETED' or old.status = 'COMPLETED' then
    return new;
  end if;

  select result.* into v_result
  from public.game_results as result
  where result.session_id = new.id;

  if not found then
    raise exception 'PROGRESS_RESULT_NOT_FOUND' using errcode = 'P0001';
  end if;

  insert into public.user_episode_progress (
    user_id, episode_id, status, best_difficulty, best_score, play_count,
    first_cleared_at, last_played_at, unlocked_at, completed_at, updated_at
  ) values (
    new.user_id, new.episode_id, 'completed', new.difficulty, v_result.score, 1,
    v_completed_at, v_completed_at, v_completed_at, v_completed_at, now()
  )
  on conflict (user_id, episode_id) do update
  set status = 'completed',
      best_difficulty = case
        when public.user_episode_progress.best_difficulty is null then excluded.best_difficulty
        when public.user_episode_progress.best_difficulty = 'easy' and excluded.best_difficulty in ('normal', 'hard') then excluded.best_difficulty
        when public.user_episode_progress.best_difficulty = 'normal' and excluded.best_difficulty = 'hard' then excluded.best_difficulty
        else public.user_episode_progress.best_difficulty
      end,
      best_score = case
        when public.user_episode_progress.best_score is null
          or excluded.best_score > public.user_episode_progress.best_score
        then excluded.best_score
        else public.user_episode_progress.best_score
      end,
      first_cleared_at = coalesce(public.user_episode_progress.first_cleared_at, excluded.first_cleared_at),
      last_played_at = excluded.last_played_at,
      completed_at = coalesce(public.user_episode_progress.completed_at, excluded.completed_at),
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists sync_user_episode_progress_on_completion_trigger on public.game_sessions;
create trigger sync_user_episode_progress_on_completion_trigger
after update of status on public.game_sessions
for each row
when (new.status = 'COMPLETED' and old.status is distinct from new.status)
execute function public.sync_user_episode_progress_on_completion();

revoke all on function public.sync_user_episode_progress_on_completion() from public, anon, authenticated;
