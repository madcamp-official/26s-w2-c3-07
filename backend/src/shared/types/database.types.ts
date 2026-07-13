export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row extends Record<string, unknown>> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

type Id = { id: string };
type Audit = { created_at: string; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<{ id: string; display_name: string; avatar_url: string | null } & Audit>;
      user_settings: Table<{ user_id: string; bgm_enabled: boolean; sfx_enabled: boolean; text_speed: number; skip_animation: boolean; locale: string; updated_at: string }>;
      game_sessions: Table<Id & { user_id: string; episode_id: string; difficulty_config_id: string; status: string; remaining_questions: number; started_at: string; expires_at: string; current_suspect_id: string | null; last_activity_at: string; completed_at: string | null; session_version: number } & Audit>;
      session_suspect_states: Table<Id & { session_id: string; suspect_id: string; current_emotion: string; questions_used: number; interrogation_status: string; last_interrogated_at: string | null; emotion: string; emotion_intensity: number; questions_asked: number; state: Json } & Audit>;
      interrogation_messages: Table<Id & { session_id: string; suspect_id: string; request_id: string; user_question: string; normalized_question: string | null; question_hash: string | null; question_type: string; npc_response: string; emotion_before: string | null; emotion_after: string | null; evasion_type: string | null; used_fact_refs: Json; question_cost: number; response_metadata: Json; created_at: string; question: string; answer: string | null; dialect_response: string | null; status: string }>;
      session_evidence: Table<Id & { session_id: string; evidence_id: string; source_type: string; viewed_at: string | null; discovered_at: string }>;
      session_clues: Table<Id & { session_id: string; clue_id: string; acquired_from_type: string; acquired_from_ref: string | null; acquired_at: string; unlocked_at: string; source: string | null }>;
      session_notes: Table<Id & { session_id: string; note_type: string; content: string; suspect_id: string | null; related_ref: Json } & Audit>;
      game_results: Table<Id & { session_id: string; selected_suspect_id: string; is_correct: boolean; resolution_type: string; score: number; acquired_core_clues: number; total_core_clues: number; ending_id: string | null; report_text: string | null; aftermath_text: string | null; completed_at: string; result_data: Json; report_status: string; report_attempt_count: number; report_last_attempt_at: string | null; report_generated_at: string | null; created_at: string }>;
      user_episode_progress: Table<Id & { user_id: string; episode_id: string; state: string; best_difficulty: string | null; best_score: number | null; first_cleared_at: string | null; last_played_at: string | null; unlocked_at: string; created_at: string; updated_at: string }>;
      user_dialect_unlocks: Table<Id & { user_id: string; dialect_expression_id: string; unlocked_at: string }>;
    };
    Views: Record<never, never>;
    Functions: {
      initialize_game_session: { Args: { p_user_id: string; p_episode_id: string; p_difficulty: string }; Returns: string };
      finalize_interrogation: {
        Args: {
          p_user_id: string; p_session_id: string; p_request_id: string; p_suspect_id: string;
          p_question: string; p_dialect_response: string; p_question_type: string; p_emotion: string;
          p_used_fact_ids: string[]; p_evasion_type: string; p_consistency_status: string;
        };
        Returns: Json;
      };
      evaluate_session_clues: { Args: { p_user_id: string; p_session_id: string; p_source?: string }; Returns: string[] };
      view_session_evidence: { Args: { p_user_id: string; p_session_id: string; p_evidence_id: string }; Returns: Json };
      submit_final_deduction: { Args: { p_user_id: string; p_session_id: string; p_suspect_id: string }; Returns: Json };
      claim_ending_report_generation: { Args: { p_user_id: string; p_session_id: string }; Returns: Json };
      complete_ending_report_generation: { Args: { p_user_id: string; p_session_id: string; p_report_text: string; p_aftermath_text: string }; Returns: Json };
      fail_ending_report_generation: { Args: { p_user_id: string; p_session_id: string }; Returns: undefined };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  game_content: {
    Tables: {
      regions: Table<Id & { code: string; name: string; description: string | null; image_url: string | null; display_order: number; is_active: boolean } & Audit>;
      episodes: Table<Id & { region_id: string; code: string; title: string; location: string | null; incident_type: string | null; synopsis: string; estimated_play_minutes: number; culprit_suspect_id: string | null; status: string; content_version: number; cover_image_url: string | null; display_order: number } & Audit>;
      episode_difficulty_configs: Table<Id & { episode_id: string; difficulty: string; questions_per_suspect: number; total_questions: number; time_limit_seconds: number; dialect_level: number; hint_limit: number; config: Json } & Audit>;
      victims: Table<Id & { episode_id: string; name: string; age: number | null; role: string | null; public_profile: Json; server_truth: Json; image_url: string | null; occupation: string | null; profile: Json } & Audit>;
      suspects: Table<Id & { episode_id: string; code: string; name: string; age: number | null; occupation: string | null; public_profile: Json; personality: Json; speech_style: Json; victim_relation: string | null; actual_route: Json; claimed_route: Json; initial_emotion: string; display_order: number; image_url: string | null; is_active: boolean; motive: string | null; is_culprit: boolean; profile: Json; public_personality: string | null; sort_order: number } & Audit>;
      episode_timelines: Table<Id & { episode_id: string; sequence_no: number; occurred_at_label: string; public_description: string | null; server_description: string; visibility: string; metadata: Json; occurred_at: string; title: string; description: string; is_secret: boolean; unlock_clue_id: string | null; sort_order: number } & Audit>;
      evidence: Table<Id & { episode_id: string; code: string; title: string; description: string; evidence_type: string; disclosure_level: string; role: string | null; initial_visible: boolean; image_url: string | null; metadata: Json; display_order: number; is_initial: boolean; sort_order: number } & Audit>;
      clues: Table<Id & { episode_id: string; code: string; title: string; content: string; clue_type: string; importance: string; record_summary: string; supports_culprit_id: string | null; source_refs: Json; excludes_suspect_refs: Json; is_repeatable: boolean; is_required_for_full_resolution: boolean; display_order: number; description: string; metadata: Json; sort_order: number } & Audit>;
      clue_unlock_conditions: Table<Id & { clue_id: string; group_no: number; condition_order: number; condition_type: string; target_ref: string | null; operator: string; expected_value: Json; created_at: string; condition_data: Json; sort_order: number }>;
      dialect_expressions: Table<Id & { episode_id: string; code: string; expression: string; standard_meaning: string; usage_context: string | null; importance: string; related_clue_id: string | null; difficulty_rules: Json; is_post_ending_only: boolean; display_order: number; region_id: string; standard_text: string; dialect_text: string; meaning: string | null; difficulty: number } & Audit>;
      suspect_facts: Table<Id & { suspect_id: string; code: string; fact_type: string; content: string; disclosure_level: string; priority: number; metadata: Json; fact_key: string; is_public: boolean; sort_order: number } & Audit>;
      suspect_lies: Table<Id & { suspect_id: string; code: string; topic: string; true_content: string; claimed_content: string; reveal_conditions: Json; lie_key: string; claim: string; truth: string; exposure_data: Json } & Audit>;
      suspect_response_rules: Table<Id & { suspect_id: string; question_type: string; response_policy: Json; allowed_fact_refs: Json; hidden_fact_refs: Json; evasion_type: string | null; difficulty_overrides: Json; rule_type: string; trigger_data: Json; response_guidance: string; priority: number } & Audit>;
      suspect_emotion_rules: Table<Id & { suspect_id: string; trigger_type: string; from_emotion: string | null; to_emotion: string; condition: Json; priority: number; trigger_data: Json; emotion: string; intensity: number } & Audit>;
      suspect_relationships: Table<Id & { episode_id: string; source_suspect_id: string; target_suspect_id: string | null; target_victim_id: string | null; relation_type: string; public_description: string | null; hidden_description: string | null; disclosure_level: string; suspect_id: string; related_suspect_id: string | null; victim_id: string | null; relationship_type: string; description: string; visibility: string; unlock_clue_id: string | null } & Audit>;
      endings: Table<Id & { episode_id: string; code: string; ending_type: string; target_suspect_id: string | null; title: string; fixed_content: Json; llm_prompt_context: Json; asset_url: string | null; display_order: number; narrative: string; conditions: Json; sort_order: number } & Audit>;
    };
    Views: Record<never, never>; Functions: Record<never, never>; Enums: Record<never, never>; CompositeTypes: Record<never, never>;
  };
  game_private: {
    Tables: {
      llm_request_logs: Table<Id & { session_id: string; user_id: string; request_id: string; model: string; purpose: string; prompt_hash: string | null; input_tokens: number | null; output_tokens: number | null; latency_ms: number | null; status: string; error_code: string | null; created_at: string }>;
    };
    Views: Record<never, never>; Functions: Record<never, never>; Enums: Record<never, never>; CompositeTypes: Record<never, never>;
  };
};

export type TableName<S extends keyof Database> = keyof Database[S]['Tables'];
export type Row<S extends keyof Database, T extends TableName<S>> = Database[S]['Tables'][T] extends Table<infer R> ? R : never;
