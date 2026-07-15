create index clues_culprit_fk_idx
  on game_content.clues(episode_id, supports_culprit_id)
  where supports_culprit_id is not null;

create index dialect_related_clue_fk_idx
  on game_content.dialect_expressions(episode_id, related_clue_id)
  where related_clue_id is not null;

create index endings_target_suspect_fk_idx
  on game_content.endings(episode_id, target_suspect_id)
  where target_suspect_id is not null;

create index episodes_culprit_fk_idx
  on game_content.episodes(id, culprit_suspect_id)
  where culprit_suspect_id is not null;

create index relationships_target_suspect_fk_idx
  on game_content.suspect_relationships(episode_id, target_suspect_id)
  where target_suspect_id is not null;

create index relationships_target_victim_fk_idx
  on game_content.suspect_relationships(episode_id, target_victim_id)
  where target_victim_id is not null;

create index llm_logs_message_fk_idx
  on game_private.llm_request_logs(message_id)
  where message_id is not null;

create index game_results_ending_fk_idx
  on public.game_results(ending_id);

create index game_sessions_current_suspect_fk_idx
  on public.game_sessions(episode_id, current_suspect_id)
  where current_suspect_id is not null;

create index game_sessions_difficulty_fk_idx
  on public.game_sessions(episode_id, difficulty_config_id);

create index session_clues_clue_fk_idx
  on public.session_clues(clue_id);

create index session_evidence_evidence_fk_idx
  on public.session_evidence(evidence_id);

create index session_notes_suspect_fk_idx
  on public.session_notes(suspect_id)
  where suspect_id is not null;

create index session_suspect_states_suspect_fk_idx
  on public.session_suspect_states(suspect_id);

create index dialect_unlocks_expression_fk_idx
  on public.user_dialect_unlocks(dialect_expression_id);

create index dialect_unlocks_source_session_fk_idx
  on public.user_dialect_unlocks(source_session_id)
  where source_session_id is not null;
