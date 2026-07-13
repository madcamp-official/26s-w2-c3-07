create extension if not exists pgcrypto;

create schema if not exists game_content;
create schema if not exists game_private;

revoke all on schema game_content from public, anon, authenticated;
revoke all on schema game_private from public, anon, authenticated;

create table game_content.regions (
  id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
  description text, dialect_name text, sort_order integer not null default 0, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table game_content.episodes (
  id uuid primary key default gen_random_uuid(), region_id uuid not null references game_content.regions(id),
  code text not null unique, title text not null, synopsis text, scene_description text,
  culprit_suspect_id uuid, default_difficulty text not null default 'normal' check (default_difficulty in ('easy','normal','hard')),
  is_published boolean not null default false, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table game_content.episode_difficulty_configs (
  id uuid primary key default gen_random_uuid(), episode_id uuid not null references game_content.episodes(id) on delete cascade,
  difficulty text not null check (difficulty in ('easy','normal','hard')), questions_per_suspect integer not null check (questions_per_suspect > 0),
  time_limit_seconds integer check (time_limit_seconds > 0), score_multiplier numeric(6,3) not null default 1,
  config jsonb not null default '{}'::jsonb, unique (episode_id, difficulty)
);
alter table game_content.episode_difficulty_configs add constraint episode_difficulty_configs_id_episode_unique unique (id, episode_id);
create table game_content.victims (
  id uuid primary key default gen_random_uuid(), episode_id uuid not null unique references game_content.episodes(id) on delete cascade,
  name text not null, age integer check (age >= 0), occupation text, profile jsonb not null default '{}'::jsonb
);
create table game_content.suspects (
  id uuid primary key default gen_random_uuid(), episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null unique, name text not null, age integer check (age >= 0), occupation text, hometown text,
  personality text, speech_style text, motive text, is_culprit boolean not null default false,
  profile jsonb not null default '{}'::jsonb, sort_order integer not null default 0,
  unique (id, episode_id)
);
alter table game_content.episodes add constraint episodes_culprit_same_episode_fk
  foreign key (culprit_suspect_id, id) references game_content.suspects(id, episode_id) deferrable initially deferred;
create table game_content.episode_timelines (
  id uuid primary key default gen_random_uuid(), episode_id uuid not null references game_content.episodes(id) on delete cascade,
  occurred_at text not null, title text not null, description text not null, is_secret boolean not null default false, sort_order integer not null default 0
);
create table game_content.evidence (
  id uuid primary key default gen_random_uuid(), episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null unique, title text not null, description text not null, evidence_type text not null,
  metadata jsonb not null default '{}'::jsonb, is_initial boolean not null default false, sort_order integer not null default 0,
  unique (id, episode_id)
);
create table game_content.clues (
  id uuid primary key default gen_random_uuid(), episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null unique, title text not null, description text not null, clue_type text not null,
  metadata jsonb not null default '{}'::jsonb, sort_order integer not null default 0,
  unique (id, episode_id)
);
create table game_content.clue_unlock_conditions (
  id uuid primary key default gen_random_uuid(), clue_id uuid not null references game_content.clues(id) on delete cascade,
  condition_type text not null, condition_data jsonb not null default '{}'::jsonb, sort_order integer not null default 0
);
create table game_content.dialect_expressions (
  id uuid primary key default gen_random_uuid(), region_id uuid not null references game_content.regions(id) on delete cascade,
  code text not null unique, standard_text text not null, dialect_text text not null, meaning text,
  usage_context text, difficulty integer not null default 1 check (difficulty between 1 and 5)
);
create table game_content.suspect_facts (
  id uuid primary key default gen_random_uuid(), suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  fact_key text not null, content text not null, is_public boolean not null default false, sort_order integer not null default 0,
  unique (suspect_id, fact_key)
);
create table game_content.suspect_lies (
  id uuid primary key default gen_random_uuid(), suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  lie_key text not null, claim text not null, truth text not null, exposure_data jsonb not null default '{}'::jsonb,
  unique (suspect_id, lie_key)
);
create table game_content.suspect_response_rules (
  id uuid primary key default gen_random_uuid(), suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  rule_type text not null, trigger_data jsonb not null default '{}'::jsonb, response_guidance text not null, priority integer not null default 0
);
create table game_content.suspect_emotion_rules (
  id uuid primary key default gen_random_uuid(), suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  trigger_type text not null, trigger_data jsonb not null default '{}'::jsonb, emotion text not null, intensity integer not null default 1 check (intensity between 1 and 5)
);
create table game_content.suspect_relationships (
  id uuid primary key default gen_random_uuid(), suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  related_suspect_id uuid references game_content.suspects(id) on delete cascade, victim_id uuid references game_content.victims(id) on delete cascade,
  relationship_type text not null, description text not null,
  check ((related_suspect_id is not null)::integer + (victim_id is not null)::integer = 1),
  check (related_suspect_id is null or related_suspect_id <> suspect_id)
);
create table game_content.endings (
  id uuid primary key default gen_random_uuid(), episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null unique, ending_type text not null, title text not null, narrative text not null,
  conditions jsonb not null default '{}'::jsonb, sort_order integer not null default 0
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade, display_name text,
  avatar_url text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade, sound_enabled boolean not null default true,
  music_enabled boolean not null default true, text_speed text not null default 'normal', locale text not null default 'ko',
  updated_at timestamptz not null default now()
);
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references game_content.episodes(id), difficulty_config_id uuid not null,
  difficulty text not null check (difficulty in ('easy','normal','hard')), status text not null default 'active' check (status in ('active','completed','abandoned')),
  remaining_questions integer not null check (remaining_questions >= 0), started_at timestamptz not null default now(), completed_at timestamptz,
  created_at timestamptz not null default now(), unique (id, user_id),
  foreign key (difficulty_config_id, episode_id) references game_content.episode_difficulty_configs(id, episode_id)
);
create table public.session_suspect_states (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.game_sessions(id) on delete cascade,
  suspect_id uuid not null references game_content.suspects(id), emotion text not null default 'neutral', emotion_intensity integer not null default 1,
  questions_asked integer not null default 0 check (questions_asked >= 0), state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(), unique (session_id, suspect_id)
);
create table public.interrogation_messages (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.game_sessions(id) on delete cascade,
  suspect_id uuid not null references game_content.suspects(id), request_id text not null,
  question text not null, answer text, dialect_response text, response_metadata jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','completed','failed')), created_at timestamptz not null default now(),
  unique (session_id, request_id)
);
create table public.session_evidence (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.game_sessions(id) on delete cascade,
  evidence_id uuid not null references game_content.evidence(id), discovered_at timestamptz not null default now(), unique (session_id, evidence_id)
);
create table public.session_clues (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.game_sessions(id) on delete cascade,
  clue_id uuid not null references game_content.clues(id), unlocked_at timestamptz not null default now(), source text, unique (session_id, clue_id)
);
create table public.session_notes (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, content text not null, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), foreign key (session_id, user_id) references public.game_sessions(id, user_id)
);
create table public.game_results (
  id uuid primary key default gen_random_uuid(), session_id uuid not null unique references public.game_sessions(id) on delete cascade,
  selected_suspect_id uuid not null references game_content.suspects(id), is_correct boolean not null, score integer not null default 0,
  ending_id uuid references game_content.endings(id), result_data jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create table public.user_episode_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  episode_id uuid not null references game_content.episodes(id) on delete cascade, status text not null default 'unlocked',
  best_score integer, play_count integer not null default 0, completed_at timestamptz, updated_at timestamptz not null default now(),
  unique (user_id, episode_id)
);
create table public.user_dialect_unlocks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  dialect_expression_id uuid not null references game_content.dialect_expressions(id) on delete cascade,
  unlocked_at timestamptz not null default now(), unique (user_id, dialect_expression_id)
);
create table game_private.llm_request_logs (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.game_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, request_id text not null,
  model text not null, prompt_hash text, input_tokens integer check (input_tokens >= 0), output_tokens integer check (output_tokens >= 0),
  latency_ms integer check (latency_ms >= 0), status text not null, error_code text, created_at timestamptz not null default now(),
  unique (session_id, request_id)
);

create index game_sessions_user_id_idx on public.game_sessions(user_id);
create index game_sessions_episode_id_idx on public.game_sessions(episode_id);
create index session_notes_user_id_idx on public.session_notes(user_id);
create index episode_timelines_episode_id_idx on game_content.episode_timelines(episode_id);
create index evidence_episode_id_idx on game_content.evidence(episode_id);
create index clues_episode_id_idx on game_content.clues(episode_id);
create index interrogation_messages_session_id_idx on public.interrogation_messages(session_id);
create index llm_request_logs_user_id_idx on game_private.llm_request_logs(user_id);

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

grant usage on schema public to authenticated;
grant select on public.profiles, public.user_settings, public.game_sessions, public.session_suspect_states,
  public.interrogation_messages, public.session_evidence, public.session_clues, public.session_notes,
  public.game_results, public.user_episode_progress, public.user_dialect_unlocks to authenticated;
grant insert, update on public.profiles, public.user_settings to authenticated;
grant insert, update, delete on public.session_notes to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_settings_select_own on public.user_settings for select to authenticated using ((select auth.uid()) = user_id);
create policy user_settings_insert_own on public.user_settings for insert to authenticated with check ((select auth.uid()) = user_id);
create policy user_settings_update_own on public.user_settings for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy game_sessions_select_own on public.game_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy session_suspect_states_select_own on public.session_suspect_states for select to authenticated using (exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy interrogation_messages_select_own on public.interrogation_messages for select to authenticated using (exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy session_evidence_select_own on public.session_evidence for select to authenticated using (exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy session_clues_select_own on public.session_clues for select to authenticated using (exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy session_notes_select_own on public.session_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy session_notes_insert_own on public.session_notes for insert to authenticated with check ((select auth.uid()) = user_id and exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy session_notes_update_own on public.session_notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy session_notes_delete_own on public.session_notes for delete to authenticated using ((select auth.uid()) = user_id);
create policy game_results_select_own on public.game_results for select to authenticated using (exists (select 1 from public.game_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy user_episode_progress_select_own on public.user_episode_progress for select to authenticated using ((select auth.uid()) = user_id);
create policy user_dialect_unlocks_select_own on public.user_dialect_unlocks for select to authenticated using ((select auth.uid()) = user_id);

revoke all on all tables in schema game_content from public, anon, authenticated;
revoke all on all sequences in schema game_content from public, anon, authenticated;
revoke all on all tables in schema game_private from public, anon, authenticated;
revoke all on all sequences in schema game_private from public, anon, authenticated;
alter default privileges in schema game_content revoke all on tables from public, anon, authenticated;
alter default privileges in schema game_private revoke all on tables from public, anon, authenticated;
alter default privileges in schema game_content revoke execute on functions from public, anon, authenticated;
alter default privileges in schema game_private revoke execute on functions from public, anon, authenticated;
