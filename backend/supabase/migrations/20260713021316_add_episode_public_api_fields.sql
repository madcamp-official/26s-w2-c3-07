alter table game_content.episodes
  add column if not exists location text,
  add column if not exists incident_type text,
  add column if not exists estimated_play_minutes integer not null default 15 check (estimated_play_minutes > 0),
  add column if not exists status text not null default 'draft' check (status in ('draft', 'available', 'coming_soon')),
  add column if not exists image_url text;

update game_content.episodes set status = 'available' where is_published = true;

alter table game_content.episode_difficulty_configs
  add column if not exists total_questions integer,
  add column if not exists dialect_level text not null default 'medium',
  add column if not exists hint_limit integer not null default 0 check (hint_limit >= 0);

update game_content.episode_difficulty_configs
set total_questions = questions_per_suspect,
    questions_per_suspect = greatest(1, floor(questions_per_suspect / 4.0)::integer)
where total_questions is null;

alter table game_content.episode_difficulty_configs
  alter column total_questions set not null,
  add constraint episode_difficulty_total_questions_positive check (total_questions > 0);

alter table game_content.episode_timelines
  add column if not exists visibility text not null default 'PRIVATE'
  check (visibility in ('PUBLIC_INITIAL', 'PRIVATE'));
