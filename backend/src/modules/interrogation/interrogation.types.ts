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
export type CharacterConsistencyStatus = 'valid' | 'invalid';

export type InterrogationInput = {
  requestId: string;
  suspectId: string;
  question: string;
  presentedEvidenceIds?: string[];
};

export type StructuredInterrogationResponse = {
  dialectResponse: string;
  emotionAfter: Emotion;
  evasionType: EvasionType | null;
  usedFactIds: string[];
  revealedFactIds: string[];
  claimedFactIds: string[];
  characterConsistencyStatus: CharacterConsistencyStatus;
  validationNotes: string[];
};

export type InterrogationMessageDto = StructuredInterrogationResponse & {
  id: string;
  sessionId: string;
  suspectId: string;
  requestId: string;
  question: string;
  questionType: QuestionType;
  questionTypeLabel: string;
  emotionBeforeLabel: string | null;
  emotionAfterLabel: string;
  presentedEvidenceIds: string[];
  createdAt: string;
};

export type UnlockedClueDto = {
  id: string;
  code: string;
  title: string;
  content: string;
  recordSummary: string | null;
  clueType: string;
  importance: string;
};

export type UnlockedEvidenceDto = {
  id: string;
  code: string;
  title: string;
  description: string;
  evidenceType: string;
};

export type InterrogationResponse = {
  message: {
    id: string;
    npcResponse: string;
    emotionAfter: Emotion;
    emotionAfterLabel: string;
    evasionType: EvasionType | null;
  };
  newlyUnlockedClues: UnlockedClueDto[];
  newlyUnlockedEvidence: UnlockedEvidenceDto[];
  remainingQuestions: number;
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

export type PromptFact = {
  id: string;
  code: string;
  content: string;
  factType: string;
  disclosureLevel: string;
};

export type PresentedEvidence = {
  id: string;
  code: string;
  title: string;
  description: string;
  evidenceType: string;
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
  facts: PromptFact[];
  lies: Array<{ claim: string; truth: string }>;
  responseRules: Array<{
    ruleType: string;
    trigger: Json;
    guidance: Json;
    allowedFactRefs: string[];
    hiddenFactRefs: string[];
  }>;
  effectiveRuleType: QuestionType;
  emotionRules: Array<{ triggerType: string; trigger: Json; emotion: string; intensity: number }>;
  dialectExpressions: Array<{
    code: string;
    standardText: string;
    dialectText: string;
    category: string;
    intensity: number;
    questionTypes: string[];
    emotionTags: string[];
    verificationStatus: string;
  }>;
  relationships: Array<{ targetSuspectId: string; relationshipType: string; publicDescription: string | null }>;
  previousMessages: Array<{ question: string; response: string }>;
  currentEmotion: string;
  difficulty: string;
  dialectLevel: number;
  revealedFactIds: string[];
  claimedFactIds: string[];
  knownEntities: string[];
};

export type PromptMetrics = {
  promptVersion: string;
  characterCount: number;
  estimatedTokens: number;
  includedFactCount: number;
  includedRuleCount: number;
  includedDialectCount: number;
  includedHistoryCount: number;
};

export type InterrogationPrompt = {
  system: string;
  user: string;
  factKeyToId: Record<string, string>;
  metrics: PromptMetrics;
};

export type LlmGeneration = {
  output: StructuredInterrogationResponse;
  provider: 'openai';
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedTokens: number | null;
  latencyMs: number;
};
