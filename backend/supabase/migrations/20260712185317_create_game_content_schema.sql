create schema if not exists game_content;
create schema if not exists game_private;

comment on schema game_content is 'Server-managed static episode, suspect, clue, dialect, and ending content';
comment on schema game_private is 'Private helper functions and operational logs; never expose through Data API';

create or replace function game_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function game_private.set_updated_at() from public;

create table game_content.regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z]{2,10}$'),
  name text not null unique,
  description text,
  image_url text,
  display_order smallint not null default 0 check (display_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table game_content.episodes (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references game_content.regions(id) on delete restrict,
  code text not null unique,
  title text not null,
  location text,
  incident_type text,
  synopsis text not null,
  estimated_play_minutes smallint not null default 15 check (estimated_play_minutes > 0),
  culprit_suspect_id uuid,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  content_version integer not null default 1 check (content_version > 0),
  cover_image_url text,
  display_order smallint not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (region_id, display_order)
);

create table game_content.episode_difficulty_configs (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  difficulty text not null check (difficulty in ('easy', 'normal', 'very_hard')),
  questions_per_suspect smallint not null check (questions_per_suspect > 0),
  total_questions smallint not null check (total_questions > 0),
  time_limit_seconds integer not null check (time_limit_seconds > 0),
  dialect_level smallint not null default 1 check (dialect_level between 1 and 3),
  hint_limit smallint not null default 0 check (hint_limit >= 0),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, difficulty),
  unique (episode_id, id)
);

create table game_content.victims (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null unique references game_content.episodes(id) on delete cascade,
  name text not null,
  age smallint check (age is null or age > 0),
  role text,
  public_profile jsonb not null default '{}'::jsonb,
  server_truth jsonb not null default '{}'::jsonb,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, id)
);

create table game_content.suspects (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null,
  name text not null,
  age smallint check (age is null or age > 0),
  occupation text,
  public_profile jsonb not null default '{}'::jsonb,
  personality jsonb not null default '{}'::jsonb,
  speech_style jsonb not null default '{}'::jsonb,
  victim_relation text,
  actual_route jsonb not null default '[]'::jsonb,
  claimed_route jsonb not null default '[]'::jsonb,
  initial_emotion text not null default 'NEUTRAL',
  display_order smallint not null default 0 check (display_order >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, code),
  unique (episode_id, display_order),
  unique (episode_id, id)
);

alter table game_content.episodes
  add constraint episodes_culprit_same_episode_fk
  foreign key (id, culprit_suspect_id)
  references game_content.suspects(episode_id, id)
  deferrable initially deferred;

create table game_content.episode_timelines (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  sequence_no smallint not null check (sequence_no >= 0),
  occurred_at_label text not null,
  public_description text,
  server_description text not null,
  visibility text not null default 'SERVER_ONLY' check (visibility in ('PUBLIC_INITIAL', 'SESSION_UNLOCKED', 'SERVER_ONLY', 'POST_ENDING')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, sequence_no)
);

create table game_content.evidence (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null,
  title text not null,
  description text not null,
  evidence_type text not null,
  disclosure_level text not null default 'SESSION_UNLOCKED' check (disclosure_level in ('PUBLIC_INITIAL', 'SESSION_UNLOCKED', 'SERVER_ONLY', 'POST_ENDING')),
  role text,
  initial_visible boolean not null default false,
  image_url text,
  metadata jsonb not null default '{}'::jsonb,
  display_order smallint not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, code),
  unique (episode_id, id)
);

create table game_content.clues (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null,
  title text not null,
  content text not null,
  clue_type text not null check (clue_type in ('PHYSICAL', 'TESTIMONY', 'TIME', 'LOCATION', 'MOTIVE', 'CONTRADICTION', 'DIALECT', 'RELATION')),
  importance text not null check (importance in ('CORE', 'SUPPORT', 'EXCLUSION', 'MOTIVE_ONLY', 'RED_HERRING_RESOLUTION')),
  record_summary text not null,
  supports_culprit_id uuid,
  source_refs jsonb not null default '[]'::jsonb,
  excludes_suspect_refs jsonb not null default '[]'::jsonb,
  is_repeatable boolean not null default false,
  is_required_for_full_resolution boolean not null default false,
  display_order smallint not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, code),
  unique (episode_id, id),
  foreign key (episode_id, supports_culprit_id)
    references game_content.suspects(episode_id, id)
    deferrable initially deferred
);

create table game_content.clue_unlock_conditions (
  id uuid primary key default gen_random_uuid(),
  clue_id uuid not null references game_content.clues(id) on delete cascade,
  group_no smallint not null default 1 check (group_no > 0),
  condition_order smallint not null default 1 check (condition_order > 0),
  condition_type text not null,
  target_ref text,
  operator text not null default 'eq',
  expected_value jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (clue_id, group_no, condition_order)
);

comment on column game_content.clue_unlock_conditions.group_no is 'Conditions inside one group are AND; separate groups are OR';

create table game_content.dialect_expressions (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null,
  expression text not null,
  standard_meaning text not null,
  usage_context text,
  importance text not null default 'SUPPORT',
  related_clue_id uuid,
  difficulty_rules jsonb not null default '{}'::jsonb,
  is_post_ending_only boolean not null default true,
  display_order smallint not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, code),
  unique (episode_id, id),
  foreign key (episode_id, related_clue_id)
    references game_content.clues(episode_id, id)
    deferrable initially deferred
);

create table game_content.suspect_facts (
  id uuid primary key default gen_random_uuid(),
  suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  code text not null,
  fact_type text not null check (fact_type in ('KNOWN', 'HEARD', 'SUSPECTED', 'HIDDEN', 'FORBIDDEN')),
  content text not null,
  disclosure_level text not null check (disclosure_level in ('LLM_ALLOWED', 'LLM_HIDDEN', 'SERVER_ONLY')),
  priority smallint not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (suspect_id, code)
);

create table game_content.suspect_lies (
  id uuid primary key default gen_random_uuid(),
  suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  code text not null,
  topic text not null,
  true_content text not null,
  claimed_content text not null,
  reveal_conditions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (suspect_id, code)
);

create table game_content.suspect_response_rules (
  id uuid primary key default gen_random_uuid(),
  suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  question_type text not null,
  response_policy jsonb not null default '{}'::jsonb,
  allowed_fact_refs jsonb not null default '[]'::jsonb,
  hidden_fact_refs jsonb not null default '[]'::jsonb,
  evasion_type text,
  difficulty_overrides jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (suspect_id, question_type)
);

create table game_content.suspect_emotion_rules (
  id uuid primary key default gen_random_uuid(),
  suspect_id uuid not null references game_content.suspects(id) on delete cascade,
  trigger_type text not null,
  from_emotion text,
  to_emotion text not null,
  condition jsonb not null default '{}'::jsonb,
  priority smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table game_content.suspect_relationships (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  source_suspect_id uuid not null,
  target_suspect_id uuid,
  target_victim_id uuid,
  relation_type text not null,
  public_description text,
  hidden_description text,
  disclosure_level text not null default 'PUBLIC_PROFILE' check (disclosure_level in ('PUBLIC_PROFILE', 'SESSION_UNLOCKED', 'SERVER_ONLY', 'POST_ENDING')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(target_suspect_id, target_victim_id) = 1),
  foreign key (episode_id, source_suspect_id)
    references game_content.suspects(episode_id, id) on delete cascade,
  foreign key (episode_id, target_suspect_id)
    references game_content.suspects(episode_id, id) on delete cascade,
  foreign key (episode_id, target_victim_id)
    references game_content.victims(episode_id, id) on delete cascade
);

create table game_content.endings (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references game_content.episodes(id) on delete cascade,
  code text not null,
  ending_type text not null check (ending_type in ('TRUE', 'WRONG_SPECIFIC', 'WRONG_FALLBACK')),
  target_suspect_id uuid,
  title text not null,
  fixed_content jsonb not null default '{}'::jsonb,
  llm_prompt_context jsonb not null default '{}'::jsonb,
  asset_url text,
  display_order smallint not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (episode_id, code),
  unique (episode_id, id),
  foreign key (episode_id, target_suspect_id)
    references game_content.suspects(episode_id, id)
    deferrable initially deferred
);

create index regions_display_order_idx on game_content.regions(display_order);
create index episodes_region_status_idx on game_content.episodes(region_id, status, display_order);
create index difficulty_episode_idx on game_content.episode_difficulty_configs(episode_id);
create index suspects_episode_order_idx on game_content.suspects(episode_id, display_order);
create index timeline_episode_sequence_idx on game_content.episode_timelines(episode_id, sequence_no);
create index evidence_episode_visibility_idx on game_content.evidence(episode_id, initial_visible, display_order);
create index clues_episode_importance_idx on game_content.clues(episode_id, importance, display_order);
create index clue_conditions_clue_group_idx on game_content.clue_unlock_conditions(clue_id, group_no, condition_order);
create index dialect_episode_order_idx on game_content.dialect_expressions(episode_id, display_order);
create index suspect_facts_suspect_type_idx on game_content.suspect_facts(suspect_id, fact_type, priority desc);
create index suspect_lies_suspect_idx on game_content.suspect_lies(suspect_id);
create index response_rules_suspect_type_idx on game_content.suspect_response_rules(suspect_id, question_type);
create index emotion_rules_suspect_priority_idx on game_content.suspect_emotion_rules(suspect_id, priority desc);
create index relationships_episode_source_idx on game_content.suspect_relationships(episode_id, source_suspect_id);
create index endings_episode_type_idx on game_content.endings(episode_id, ending_type);

create trigger regions_set_updated_at before update on game_content.regions for each row execute function game_private.set_updated_at();
create trigger episodes_set_updated_at before update on game_content.episodes for each row execute function game_private.set_updated_at();
create trigger difficulty_set_updated_at before update on game_content.episode_difficulty_configs for each row execute function game_private.set_updated_at();
create trigger victims_set_updated_at before update on game_content.victims for each row execute function game_private.set_updated_at();
create trigger suspects_set_updated_at before update on game_content.suspects for each row execute function game_private.set_updated_at();
create trigger timelines_set_updated_at before update on game_content.episode_timelines for each row execute function game_private.set_updated_at();
create trigger evidence_set_updated_at before update on game_content.evidence for each row execute function game_private.set_updated_at();
create trigger clues_set_updated_at before update on game_content.clues for each row execute function game_private.set_updated_at();
create trigger dialect_set_updated_at before update on game_content.dialect_expressions for each row execute function game_private.set_updated_at();
create trigger suspect_facts_set_updated_at before update on game_content.suspect_facts for each row execute function game_private.set_updated_at();
create trigger suspect_lies_set_updated_at before update on game_content.suspect_lies for each row execute function game_private.set_updated_at();
create trigger response_rules_set_updated_at before update on game_content.suspect_response_rules for each row execute function game_private.set_updated_at();
create trigger emotion_rules_set_updated_at before update on game_content.suspect_emotion_rules for each row execute function game_private.set_updated_at();
create trigger relationships_set_updated_at before update on game_content.suspect_relationships for each row execute function game_private.set_updated_at();
create trigger endings_set_updated_at before update on game_content.endings for each row execute function game_private.set_updated_at();

alter table game_content.regions enable row level security;
alter table game_content.episodes enable row level security;
alter table game_content.episode_difficulty_configs enable row level security;
alter table game_content.victims enable row level security;
alter table game_content.suspects enable row level security;
alter table game_content.episode_timelines enable row level security;
alter table game_content.evidence enable row level security;
alter table game_content.clues enable row level security;
alter table game_content.clue_unlock_conditions enable row level security;
alter table game_content.dialect_expressions enable row level security;
alter table game_content.suspect_facts enable row level security;
alter table game_content.suspect_lies enable row level security;
alter table game_content.suspect_response_rules enable row level security;
alter table game_content.suspect_emotion_rules enable row level security;
alter table game_content.suspect_relationships enable row level security;
alter table game_content.endings enable row level security;

revoke all on schema game_content from anon, authenticated;
revoke all on all tables in schema game_content from anon, authenticated;
grant usage on schema game_content to service_role;
grant all privileges on all tables in schema game_content to service_role;
grant all privileges on all sequences in schema game_content to service_role;

comment on column game_content.episodes.culprit_suspect_id is 'SERVER ONLY: never return directly to browser clients';
comment on column game_content.suspects.actual_route is 'SERVER ONLY: true movement route';
comment on column game_content.suspects.claimed_route is 'Server-controlled claimed alibi data';
comment on table game_content.suspect_facts is 'SERVER ONLY LLM knowledge boundaries';
comment on table game_content.suspect_lies is 'SERVER ONLY lie definitions';
comment on table game_content.clue_unlock_conditions is 'SERVER ONLY clue unlock rules';
