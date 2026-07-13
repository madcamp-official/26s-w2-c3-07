alter table game_content.episode_difficulty_configs
  drop constraint if exists episode_difficulty_configs_difficulty_check;

alter table game_content.episode_difficulty_configs
  add constraint episode_difficulty_configs_difficulty_check
  check (difficulty in ('easy', 'normal', 'hard'));
