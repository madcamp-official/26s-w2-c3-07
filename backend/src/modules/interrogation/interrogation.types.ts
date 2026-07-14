import type { Json } from '../../shared/types/database.types.js';

export const QUESTION_TYPES = [
  'Q-TIME', 'Q-PLACE', 'Q-RELATION', 'Q-MOTIVE', 'Q-EVIDENCE', 'Q-OTHER',
  'Q-CONTRADICTION', 'Q-ACCUSATION', 'Q-PROMPT', 'Q-SMALLTALK', 'Q-UNKNOWN'
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const EMOTIONS = [
  'CALM', 'NEUTRAL', 'NERVOUS', 'DEFENSIVE', 'ANGRY', 'FEARFUL', 'GUILTY',
  'SAD', 'BREAKDOWN', 'MOCKING', 'AGGRESSIVE_DEFENSIVE'
] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const EVASION_TYPES = [
  'NONE', 'PARTIAL_ANSWER', 'DENIAL', 'DEFLECTION', 'UNKNOWN', 'PROMPT_REJECTION'
] as const;
export type EvasionType = (typeof EVASION_TYPES)[number];
export type ConsistencyStatus = 'VALID' | 'INVALID';

export type InterrogationInput = {
  requestId: string;
  suspectId: string;
  question: string;
};

export type StructuredInterrogationResponse = {
  dialectResponse: string;
  emotion: Emotion;
  usedFactIds: string[];
  evasionType: EvasionType;
  consistencyStatus: ConsistencyStatus;
};

export type InterrogationMessageDto = StructuredInterrogationResponse & {
  id: string;
  sessionId: string;
  suspectId: string;
  requestId: string;
  question: string;
  questionType: QuestionType;
  createdAt: string;
};

export type OwnedSession = {
  id: string;
  user_id: string;
  episode_id: string;
  difficulty_config_id: string;
  status: string;
  remaining_questions: number;
  expires_at: string;
  current_suspect_id: string | null;
};

export type SuspectKnowledge = {
  suspect: {
    id: string;
    name: string;
    age: number | null;
    occupation: string | null;
    personality: Json;
    speechStyle: Json;
    publicProfile: Json;
  };
  facts: Array<{ id: string; content: string; isPublic: boolean }>;
  lies: Array<{ claim: string; truth: string }>;
  responseRules: Array<{ ruleType: string; trigger: Json; guidance: Json }>;
  emotionRules: Array<{ triggerType: string; trigger: Json; emotion: string; intensity: number }>;
  dialectExpressions: Array<{ standardText: string; dialectText: string; usageContext: string | null }>;
  previousMessages: Array<{ question: string; response: string; metadata: Json }>;
  currentEmotion: string;
  revealedFactIds: string[];
  knownEntities: string[];
};

export type LlmGeneration = {
  output: StructuredInterrogationResponse;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
};
