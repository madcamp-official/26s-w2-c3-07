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
      profiles: Table<{ user_id: string; display_name: string | null; avatar_url: string | null } & Audit>;
      user_settings: Table<{ user_id: string; sound_enabled: boolean; music_enabled: boolean; text_speed: string; locale: string; updated_at: string }>;
      game_sessions: Table<Id & { user_id: string; episode_id: string; difficulty_config_id: string; difficulty: string; status: string; remaining_questions: number; started_at: string; expires_at: string; current_suspect_id: string | null; last_activity_at: string; completed_at: string | null; created_at: string }>;
      session_suspect_states: Table<Id & { session_id: string; suspect_id: string; emotion: string; emotion_intensity: number; questions_asked: number; state: Json; updated_at: string }>;
      interrogation_messages: Table<Id & { session_id: string; suspect_id: string; request_id: string; question: string; answer: string | null; dialect_response: string | null; response_metadata: Json; status: string; created_at: string }>;
      session_evidence: Table<Id & { session_id: string; evidence_id: string; discovered_at: string; viewed_at: string | null }>;
      session_clues: Table<Id & { session_id: string; clue_id: string; unlocked_at: string; source: string | null }>;
      session_notes: Table<Id & { session_id: string; user_id: string; note_type: string; content: string; suspect_id: string | null; related_ref: Json } & Audit>;
      game_results: Table<Id & { session_id: string; selected_suspect_id: string; is_correct: boolean; score: number; ending_id: string | null; result_data: Json; report_text: string | null; aftermath_text: string | null; report_status: string; report_attempt_count: number; report_last_attempt_at: string | null; report_generated_at: string | null; created_at: string }>;
      user_episode_progress: Table<Id & { user_id: string; episode_id: string; status: string; best_score: number | null; play_count: number; completed_at: string | null; updated_at: string }>;
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
      regions: Table<Id & { code: string; name: string; description: string | null; dialect_name: string | null; image_url: string | null; sort_order: number; is_active: boolean } & Audit>;
      episodes: Table<Id & { region_id: string; code: string; title: string; synopsis: string | null; scene_description: string | null; culprit_suspect_id: string | null; default_difficulty: string; is_published: boolean; sort_order: number; location: string | null; incident_type: string | null; estimated_play_minutes: number; status: string; image_url: string | null } & Audit>;
      episode_difficulty_configs: Table<Id & { episode_id: string; difficulty: string; questions_per_suspect: number; total_questions: number; time_limit_seconds: number | null; dialect_level: string; hint_limit: number; score_multiplier: number; config: Json }>;
      victims: Table<Id & { episode_id: string; name: string; age: number | null; occupation: string | null; profile: Json }>;
      suspects: Table<Id & { episode_id: string; code: string; name: string; age: number | null; occupation: string | null; hometown: string | null; personality: string | null; speech_style: string | null; motive: string | null; is_culprit: boolean; profile: Json; public_profile: Json; public_personality: string | null; victim_relation: string | null; initial_emotion: string; image_url: string | null; sort_order: number }>;
      episode_timelines: Table<Id & { episode_id: string; occurred_at: string; title: string; description: string; is_secret: boolean; visibility: string; unlock_clue_id: string | null; sort_order: number }>;
      evidence: Table<Id & { episode_id: string; code: string; title: string; description: string; evidence_type: string; metadata: Json; is_initial: boolean; sort_order: number }>;
      clues: Table<Id & { episode_id: string; code: string; title: string; description: string; clue_type: string; metadata: Json; sort_order: number }>;
      clue_unlock_conditions: Table<Id & { clue_id: string; condition_type: string; condition_data: Json; group_no: number; operator: string; sort_order: number }>;
      dialect_expressions: Table<Id & { region_id: string; code: string; standard_text: string; dialect_text: string; meaning: string | null; usage_context: string | null; difficulty: number }>;
      suspect_facts: Table<Id & { suspect_id: string; fact_key: string; content: string; is_public: boolean; sort_order: number }>;
      suspect_lies: Table<Id & { suspect_id: string; lie_key: string; claim: string; truth: string; exposure_data: Json }>;
      suspect_response_rules: Table<Id & { suspect_id: string; rule_type: string; trigger_data: Json; response_guidance: string; priority: number }>;
      suspect_emotion_rules: Table<Id & { suspect_id: string; trigger_type: string; trigger_data: Json; emotion: string; intensity: number }>;
      suspect_relationships: Table<Id & { suspect_id: string; related_suspect_id: string | null; victim_id: string | null; relationship_type: string; description: string; visibility: string; unlock_clue_id: string | null }>;
      endings: Table<Id & { episode_id: string; code: string; ending_type: string; title: string; narrative: string; conditions: Json; asset_url: string | null; sort_order: number }>;
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
