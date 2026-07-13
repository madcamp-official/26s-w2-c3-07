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
      game_sessions: Table<Id & { user_id: string; episode_id: string; difficulty_config_id: string; difficulty: string; status: string; remaining_questions: number; started_at: string; completed_at: string | null; created_at: string }>;
      session_suspect_states: Table<Id & { session_id: string; suspect_id: string; emotion: string; emotion_intensity: number; questions_asked: number; state: Json; updated_at: string }>;
      interrogation_messages: Table<Id & { session_id: string; suspect_id: string; request_id: string; question: string; answer: string | null; dialect_response: string | null; response_metadata: Json; status: string; created_at: string }>;
      session_evidence: Table<Id & { session_id: string; evidence_id: string; discovered_at: string }>;
      session_clues: Table<Id & { session_id: string; clue_id: string; unlocked_at: string; source: string | null }>;
      session_notes: Table<Id & { session_id: string; user_id: string; content: string } & Audit>;
      game_results: Table<Id & { session_id: string; selected_suspect_id: string; is_correct: boolean; score: number; ending_id: string | null; result_data: Json; created_at: string }>;
      user_episode_progress: Table<Id & { user_id: string; episode_id: string; status: string; best_score: number | null; play_count: number; completed_at: string | null; updated_at: string }>;
      user_dialect_unlocks: Table<Id & { user_id: string; dialect_expression_id: string; unlocked_at: string }>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  game_content: {
    Tables: {
      regions: Table<Id & { code: string; name: string; description: string | null; dialect_name: string | null; image_url: string | null; sort_order: number; is_active: boolean } & Audit>;
      episodes: Table<Id & { region_id: string; code: string; title: string; synopsis: string | null; scene_description: string | null; culprit_suspect_id: string | null; default_difficulty: string; is_published: boolean; sort_order: number; location: string | null; incident_type: string | null; estimated_play_minutes: number; status: string; image_url: string | null } & Audit>;
      episode_difficulty_configs: Table<Id & { episode_id: string; difficulty: string; questions_per_suspect: number; total_questions: number; time_limit_seconds: number | null; dialect_level: string; hint_limit: number; score_multiplier: number; config: Json }>;
      victims: Table<Id & { episode_id: string; name: string; age: number | null; occupation: string | null; profile: Json }>;
      suspects: Table<Id & { episode_id: string; code: string; name: string; age: number | null; occupation: string | null; hometown: string | null; personality: string | null; speech_style: string | null; motive: string | null; is_culprit: boolean; profile: Json; sort_order: number }>;
      episode_timelines: Table<Id & { episode_id: string; occurred_at: string; title: string; description: string; is_secret: boolean; visibility: string; sort_order: number }>;
      evidence: Table<Id & { episode_id: string; code: string; title: string; description: string; evidence_type: string; metadata: Json; is_initial: boolean; sort_order: number }>;
      clues: Table<Id & { episode_id: string; code: string; title: string; description: string; clue_type: string; metadata: Json; sort_order: number }>;
      clue_unlock_conditions: Table<Id & { clue_id: string; condition_type: string; condition_data: Json; sort_order: number }>;
      dialect_expressions: Table<Id & { region_id: string; code: string; standard_text: string; dialect_text: string; meaning: string | null; usage_context: string | null; difficulty: number }>;
      suspect_facts: Table<Id & { suspect_id: string; fact_key: string; content: string; is_public: boolean; sort_order: number }>;
      suspect_lies: Table<Id & { suspect_id: string; lie_key: string; claim: string; truth: string; exposure_data: Json }>;
      suspect_response_rules: Table<Id & { suspect_id: string; rule_type: string; trigger_data: Json; response_guidance: string; priority: number }>;
      suspect_emotion_rules: Table<Id & { suspect_id: string; trigger_type: string; trigger_data: Json; emotion: string; intensity: number }>;
      suspect_relationships: Table<Id & { suspect_id: string; related_suspect_id: string | null; victim_id: string | null; relationship_type: string; description: string }>;
      endings: Table<Id & { episode_id: string; code: string; ending_type: string; title: string; narrative: string; conditions: Json; sort_order: number }>;
    };
    Views: Record<never, never>; Functions: Record<never, never>; Enums: Record<never, never>; CompositeTypes: Record<never, never>;
  };
  game_private: {
    Tables: {
      llm_request_logs: Table<Id & { session_id: string; user_id: string; request_id: string; model: string; prompt_hash: string | null; input_tokens: number | null; output_tokens: number | null; latency_ms: number | null; status: string; error_code: string | null; created_at: string }>;
    };
    Views: Record<never, never>; Functions: Record<never, never>; Enums: Record<never, never>; CompositeTypes: Record<never, never>;
  };
};

export type TableName<S extends keyof Database> = keyof Database[S]['Tables'];
export type Row<S extends keyof Database, T extends TableName<S>> = Database[S]['Tables'][T] extends Table<infer R> ? R : never;
