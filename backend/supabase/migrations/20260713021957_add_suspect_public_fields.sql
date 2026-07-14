alter table game_content.suspects
  add column if not exists public_profile jsonb not null default '{}'::jsonb,
  add column if not exists public_personality text,
  add column if not exists victim_relation text,
  add column if not exists initial_emotion text not null default 'neutral',
  add column if not exists image_url text;
