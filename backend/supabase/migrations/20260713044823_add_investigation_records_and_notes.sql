alter table public.session_notes
  add column if not exists note_type text not null default 'FREE',
  add column if not exists suspect_id uuid references game_content.suspects(id),
  add column if not exists related_ref jsonb not null default '{}'::jsonb,
  add constraint session_notes_note_type_check check (note_type in ('FREE','CONTRADICTION','DIALECT'));

create index if not exists session_notes_session_user_updated_idx
  on public.session_notes (session_id, user_id, updated_at desc);

alter table game_content.episode_timelines
  drop constraint if exists episode_timelines_visibility_check;
alter table game_content.episode_timelines
  add column if not exists unlock_clue_id uuid references game_content.clues(id) on delete set null,
  add constraint episode_timelines_visibility_check check (visibility in ('PUBLIC_INITIAL','CLUE_UNLOCKED','PRIVATE')),
  add constraint episode_timelines_unlock_clue_check check (visibility <> 'CLUE_UNLOCKED' or unlock_clue_id is not null);

alter table game_content.suspect_relationships
  add column if not exists visibility text not null default 'HIDDEN',
  add column if not exists unlock_clue_id uuid references game_content.clues(id) on delete set null,
  add constraint suspect_relationships_visibility_check check (visibility in ('PUBLIC','CLUE_UNLOCKED','HIDDEN')),
  add constraint suspect_relationships_unlock_clue_check check (visibility <> 'CLUE_UNLOCKED' or unlock_clue_id is not null);

create index if not exists episode_timelines_unlock_clue_idx
  on game_content.episode_timelines (episode_id, unlock_clue_id)
  where visibility = 'CLUE_UNLOCKED';
create index if not exists suspect_relationships_unlock_clue_idx
  on game_content.suspect_relationships (unlock_clue_id)
  where visibility = 'CLUE_UNLOCKED';

create or replace function public.validate_session_note_scope()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_episode_id uuid;
begin
  select session.episode_id into v_episode_id
  from public.game_sessions as session
  where session.id = new.session_id and session.user_id = new.user_id;
  if not found then
    raise exception 'NOTE_SESSION_NOT_OWNED' using errcode = 'P0001';
  end if;
  if new.suspect_id is not null and not exists (
    select 1 from game_content.suspects as suspect
    where suspect.id = new.suspect_id and suspect.episode_id = v_episode_id
  ) then
    raise exception 'NOTE_SUSPECT_NOT_IN_EPISODE' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_session_note_scope_trigger on public.session_notes;
create trigger validate_session_note_scope_trigger
before insert or update on public.session_notes
for each row execute function public.validate_session_note_scope();

revoke all on function public.validate_session_note_scope() from public, anon, authenticated;
