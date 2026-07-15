create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '수사관',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  bgm_enabled boolean not null default true,
  sfx_enabled boolean not null default true,
  text_speed smallint not null default 2 check (text_speed between 1 and 3),
  skip_animation boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  episode_id uuid not null references game_content.episodes(id) on delete restrict,
  difficulty_config_id uuid not null,
  status text not null default 'CREATED' check (status in ('CREATED', 'INTRO_VIEWING', 'INTERROGATING', 'READY_TO_DEDUCE', 'SUBMITTED', 'COMPLETED', 'EXPIRED', 'ABANDONED', 'ERROR')),
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  remaining_questions smallint not null check (remaining_questions >= 0),
  current_suspect_id uuid,
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  session_version integer not null default 1 check (session_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (episode_id, difficulty_config_id)
    references game_content.episode_difficulty_configs(episode_id, id)
    on delete restrict,
  foreign key (episode_id, current_suspect_id)
    references game_content.suspects(episode_id, id)
    on delete restrict
);

create table public.session_suspect_states (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  suspect_id uuid not null references game_content.suspects(id) on delete restrict,
  current_emotion text not null default 'NEUTRAL',
  questions_used smallint not null default 0 check (questions_used >= 0),
  interrogation_status text not null default 'AVAILABLE' check (interrogation_status in ('NOT_STARTED', 'AVAILABLE', 'EXHAUSTED')),
  last_interrogated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, suspect_id)
);

create table public.interrogation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  suspect_id uuid not null references game_content.suspects(id) on delete restrict,
  request_id uuid not null unique,
  user_question text not null check (char_length(btrim(user_question)) > 0),
  normalized_question text,
  question_hash text,
  question_type text not null,
  npc_response text not null,
  emotion_before text,
  emotion_after text,
  evasion_type text,
  used_fact_refs jsonb not null default '[]'::jsonb,
  question_cost smallint not null default 1 check (question_cost in (0, 1)),
  response_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.session_evidence (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  evidence_id uuid not null references game_content.evidence(id) on delete restrict,
  source_type text not null default 'INITIAL',
  viewed_at timestamptz not null default now(),
  unique (session_id, evidence_id)
);

create table public.session_clues (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  clue_id uuid not null references game_content.clues(id) on delete restrict,
  acquired_from_type text not null,
  acquired_from_ref text,
  acquired_at timestamptz not null default now(),
  unique (session_id, clue_id)
);

create table public.session_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  suspect_id uuid references game_content.suspects(id) on delete set null,
  note_type text not null default 'FREEFORM' check (note_type in ('FREEFORM', 'DIALECT', 'CONTRADICTION')),
  content text not null check (char_length(btrim(content)) > 0),
  related_ref jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique references public.game_sessions(id) on delete cascade,
  selected_suspect_id uuid not null references game_content.suspects(id) on delete restrict,
  is_correct boolean not null,
  resolution_type text not null check (resolution_type in ('FULL_RESOLUTION', 'CULPRIT_CORRECT', 'WRONG_SUSPECT')),
  ending_id uuid not null references game_content.endings(id) on delete restrict,
  score integer check (score is null or score >= 0),
  acquired_core_clues smallint not null default 0 check (acquired_core_clues >= 0),
  total_core_clues smallint not null default 0 check (total_core_clues >= 0),
  report_text text,
  aftermath_text text,
  completed_at timestamptz not null default now()
);

create table public.user_episode_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  state text not null default 'LOCKED' check (state in ('LOCKED', 'UNLOCKED', 'IN_PROGRESS', 'COMPLETED')),
  best_difficulty text check (best_difficulty is null or best_difficulty in ('easy', 'normal', 'very_hard')),
  best_score integer check (best_score is null or best_score >= 0),
  first_cleared_at timestamptz,
  last_played_at timestamptz,
  unlocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, episode_id)
);

create table public.user_dialect_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  dialect_expression_id uuid not null references game_content.dialect_expressions(id) on delete cascade,
  source_session_id uuid references public.game_sessions(id) on delete set null,
  unlocked_at timestamptz not null default now(),
  unique (user_id, dialect_expression_id)
);

create table game_private.llm_request_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  message_id uuid references public.interrogation_messages(id) on delete set null,
  purpose text not null,
  model text,
  status text not null check (status in ('STARTED', 'SUCCEEDED', 'FAILED', 'VALIDATION_FAILED')),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  prompt_tokens integer check (prompt_tokens is null or prompt_tokens >= 0),
  completion_tokens integer check (completion_tokens is null or completion_tokens >= 0),
  error_code text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index game_sessions_user_status_idx on public.game_sessions(user_id, status, last_activity_at desc);
create index game_sessions_episode_idx on public.game_sessions(episode_id);
create index game_sessions_expires_at_idx on public.game_sessions(expires_at) where status in ('INTERROGATING', 'READY_TO_DEDUCE');
create index session_suspect_states_session_idx on public.session_suspect_states(session_id);
create index interrogation_messages_session_created_idx on public.interrogation_messages(session_id, created_at);
create index interrogation_messages_suspect_created_idx on public.interrogation_messages(suspect_id, created_at);
create index interrogation_messages_hash_idx on public.interrogation_messages(session_id, suspect_id, question_hash) where question_hash is not null;
create index session_evidence_session_idx on public.session_evidence(session_id);
create index session_clues_session_idx on public.session_clues(session_id, acquired_at);
create index session_notes_session_updated_idx on public.session_notes(session_id, updated_at desc);
create index game_results_selected_suspect_idx on public.game_results(selected_suspect_id);
create index user_progress_user_state_idx on public.user_episode_progress(user_id, state);
create index user_progress_episode_idx on public.user_episode_progress(episode_id);
create index dialect_unlocks_user_idx on public.user_dialect_unlocks(user_id, unlocked_at desc);
create index llm_logs_session_created_idx on game_private.llm_request_logs(session_id, created_at desc);
create index llm_logs_status_created_idx on game_private.llm_request_logs(status, created_at desc);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function game_private.set_updated_at();
create trigger user_settings_set_updated_at before update on public.user_settings for each row execute function game_private.set_updated_at();
create trigger game_sessions_set_updated_at before update on public.game_sessions for each row execute function game_private.set_updated_at();
create trigger session_suspect_states_set_updated_at before update on public.session_suspect_states for each row execute function game_private.set_updated_at();
create trigger session_notes_set_updated_at before update on public.session_notes for each row execute function game_private.set_updated_at();
create trigger user_progress_set_updated_at before update on public.user_episode_progress for each row execute function game_private.set_updated_at();

create or replace function game_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), '수사관'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function game_private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function game_private.handle_new_user();

insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), nullif(u.raw_user_meta_data ->> 'name', ''), '수사관'),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;

insert into public.user_settings (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.game_sessions enable row level security;
alter table public.session_suspect_states enable row level security;
alter table public.interrogation_messages enable row level security;
alter table public.session_evidence enable row level security;
alter table public.session_clues enable row level security;
alter table public.session_notes enable row level security;
alter table public.game_results enable row level security;
alter table public.user_episode_progress enable row level security;
alter table public.user_dialect_unlocks enable row level security;
alter table game_private.llm_request_logs enable row level security;

revoke all on schema game_private from anon, authenticated;
revoke all on all tables in schema game_private from anon, authenticated;
grant usage on schema game_private to service_role;
grant all privileges on all tables in schema game_private to service_role;
grant all privileges on all sequences in schema game_private to service_role;

comment on table public.game_sessions is 'Server-written game session state; authenticated users may only read their own rows';
comment on table public.interrogation_messages is 'Validated user question and NPC response pairs';
comment on table public.game_results is 'Server-computed final result; clients cannot write this table directly';
comment on table game_private.llm_request_logs is 'Operational metadata only. Do not store raw secrets or complete prompts unless explicitly required';
