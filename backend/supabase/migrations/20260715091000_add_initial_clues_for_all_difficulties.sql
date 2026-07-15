insert into game_content.difficulty_initial_clues (
  difficulty_config_id,
  clue_id,
  display_order
)
select
  config.id,
  easy_initial.clue_id,
  1
from game_content.episode_difficulty_configs as config
join game_content.episode_difficulty_configs as easy_config
  on easy_config.episode_id = config.episode_id
 and easy_config.difficulty = 'easy'
join game_content.difficulty_initial_clues as easy_initial
  on easy_initial.difficulty_config_id = easy_config.id
where not exists (
  select 1
  from game_content.difficulty_initial_clues as existing
  where existing.difficulty_config_id = config.id
)
on conflict (difficulty_config_id, clue_id) do nothing;

insert into public.session_clues (
  session_id,
  clue_id,
  acquired_from_type,
  acquired_from_ref,
  acquired_at
)
select
  session.id,
  initial.clue_id,
  'INITIAL_DIFFICULTY',
  session.difficulty_config_id::text,
  coalesce(session.started_at, now())
from public.game_sessions as session
join game_content.difficulty_initial_clues as initial
  on initial.difficulty_config_id = session.difficulty_config_id
on conflict (session_id, clue_id) do nothing;
