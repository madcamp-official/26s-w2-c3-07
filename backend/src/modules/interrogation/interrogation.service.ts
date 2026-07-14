import { createHash } from 'node:crypto';
import { AppError } from '../../shared/errors/app-error.js';
import type { Json } from '../../shared/types/database.types.js';
import { InterrogationLlmError, interrogationLlm } from './interrogation.llm.js';
import { buildInterrogationPrompt } from './interrogation.prompt.js';
import { interrogationRepository as repository, type MessageRow } from './interrogation.repository.js';
import { classifyQuestion, promptRejectionResponse, selectPromptFacts, validateGuardedResponse } from './interrogation.guard.js';
import {
  EMOTIONS, EVASION_TYPES, QUESTION_TYPES,
  type Emotion, type InterrogationInput, type InterrogationMessageDto,
  type InterrogationResponse, type StructuredInterrogationResponse
} from './interrogation.types.js';

const MAX_GENERATION_ATTEMPTS = 2;

const stringArray = (value: Json): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string')
  : [];

function metadata(row: MessageRow): Record<string, unknown> {
  return typeof row.response_metadata === 'object' && row.response_metadata !== null && !Array.isArray(row.response_metadata)
    ? row.response_metadata as Record<string, unknown> : {};
}

export function toInterrogationDto(row: MessageRow): InterrogationMessageDto {
  const meta = metadata(row);
  const questionType = QUESTION_TYPES.includes(row.question_type as (typeof QUESTION_TYPES)[number])
    ? row.question_type as (typeof QUESTION_TYPES)[number] : 'Q-UNKNOWN';
  const emotionAfter = EMOTIONS.includes(row.emotion_after as Emotion) ? row.emotion_after as Emotion : 'NEUTRAL';
  const evasionType = EVASION_TYPES.includes(row.evasion_type as (typeof EVASION_TYPES)[number])
    ? row.evasion_type as (typeof EVASION_TYPES)[number] : null;
  return {
    id: row.id,
    sessionId: row.session_id,
    suspectId: row.suspect_id,
    requestId: row.request_id,
    question: row.user_question,
    dialectResponse: row.npc_response,
    questionType,
    emotionAfter,
    evasionType,
    usedFactIds: stringArray(row.used_fact_refs),
    revealedFactIds: stringArray(row.revealed_fact_refs),
    claimedFactIds: stringArray(row.claimed_fact_refs),
    presentedEvidenceIds: stringArray(row.presented_evidence_refs),
    characterConsistencyStatus: meta.characterConsistencyStatus === 'invalid' ? 'invalid' : 'valid',
    validationNotes: Array.isArray(meta.validationNotes)
      ? meta.validationNotes.filter((note): note is string => typeof note === 'string') : [],
    createdAt: row.created_at
  };
}

const toAskResponse = (row: MessageRow, remainingQuestions: number, newlyUnlockedClues: InterrogationResponse['newlyUnlockedClues']): InterrogationResponse => {
  const dto = toInterrogationDto(row);
  return {
    message: { id: dto.id, npcResponse: dto.dialectResponse, emotionAfter: dto.emotionAfter, evasionType: dto.evasionType },
    newlyUnlockedClues,
    remainingQuestions
  };
};

const rpcErrors: Record<string, [number, string]> = {
  INTERROGATION_SESSION_NOT_FOUND: [404, 'SESSION_NOT_FOUND'],
  INTERROGATION_STATE_INVALID: [409, 'INTERROGATION_STATE_INVALID'],
  INTERROGATION_SESSION_EXPIRED: [409, 'SESSION_EXPIRED'],
  INTERROGATION_QUESTIONS_EXHAUSTED: [409, 'INTERROGATION_QUESTIONS_EXHAUSTED'],
  INTERROGATION_SUSPECT_NOT_SELECTED: [409, 'INTERROGATION_SUSPECT_NOT_SELECTED'],
  INTERROGATION_SUSPECT_NOT_IN_EPISODE: [400, 'SUSPECT_NOT_IN_EPISODE'],
  INTERROGATION_EVIDENCE_NOT_AVAILABLE: [400, 'INTERROGATION_EVIDENCE_NOT_AVAILABLE'],
  INTERROGATION_FACT_NOT_ALLOWED: [502, 'INTERROGATION_FACT_NOT_ALLOWED'],
  INTERROGATION_SUSPECT_LIMIT_REACHED: [409, 'INTERROGATION_SUSPECT_LIMIT_REACHED']
};

function mapRpcError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error);
  for (const [databaseCode, [status, apiCode]] of Object.entries(rpcErrors)) {
    if (message.includes(databaseCode)) throw new AppError(status, databaseCode, apiCode);
  }
  throw error;
}

async function ownedSession(sessionId: string, userId: string) {
  const session = await repository.findOwnedSession(sessionId, userId);
  if (!session) throw new AppError(404, 'Session not found', 'SESSION_NOT_FOUND');
  return session;
}

async function safeLog(input: Parameters<typeof repository.logLlm>[0]): Promise<void> {
  await repository.logLlm(input).catch(() => undefined);
}

export const interrogationService = {
  async ask(sessionId: string, userId: string, input: InterrogationInput): Promise<InterrogationResponse> {
    const session = await ownedSession(sessionId, userId);
    const duplicate = await repository.findByRequest(sessionId, input.requestId);
    if (duplicate) return toAskResponse(duplicate, session.remaining_questions, []);
    if (session.status !== 'INTERROGATING') throw new AppError(409, 'Session is not interrogating', 'INTERROGATION_STATE_INVALID');
    if (new Date(session.expires_at).getTime() <= Date.now()) throw new AppError(409, 'Session expired', 'SESSION_EXPIRED');
    if (session.remaining_questions <= 0) throw new AppError(409, 'No questions remaining', 'INTERROGATION_QUESTIONS_EXHAUSTED');

    const presentedEvidenceIds = input.presentedEvidenceIds ?? [];
    const [knowledge, questionsUsed, perSuspectLimit, presentedEvidence] = await Promise.all([
      repository.loadKnowledge(session, input.suspectId),
      repository.getSuspectQuestionCount(session.id, input.suspectId),
      repository.getQuestionsPerSuspect(session.difficulty_config_id),
      repository.findPresentedEvidence(session, presentedEvidenceIds)
    ]);
    if (!knowledge || questionsUsed === null) throw new AppError(400, 'Suspect not in episode', 'SUSPECT_NOT_IN_EPISODE');
    if (presentedEvidence.length !== presentedEvidenceIds.length) throw new AppError(400, 'Evidence is not acquired for this session', 'INTERROGATION_EVIDENCE_NOT_AVAILABLE');
    if (session.current_suspect_id !== input.suspectId) throw new AppError(409, 'Select this suspect first', 'INTERROGATION_SUSPECT_NOT_SELECTED');
    if (perSuspectLimit === null) throw new AppError(409, 'Difficulty configuration missing', 'INTERROGATION_STATE_INVALID');
    if (questionsUsed >= perSuspectLimit) throw new AppError(409, 'Suspect question limit reached', 'INTERROGATION_SUSPECT_LIMIT_REACHED');

    const questionType = classifyQuestion(input.question);
    const guardedKnowledge = { ...knowledge, facts: selectPromptFacts(knowledge, questionType) };
    let response: StructuredInterrogationResponse;
    let provider = 'local';
    let model = 'guarded-local';
    let inputTokens: number | null = 0;
    let outputTokens: number | null = 0;
    let latencyMs = 0;
    let promptHash: string | null = null;
    let usedAttempts = 0;

    if (questionType === 'Q-PROMPT') {
      response = promptRejectionResponse(knowledge.currentEmotion);
    } else {
      let validationErrors: string[] = [];
      let accepted: StructuredInterrogationResponse | null = null;
      let lastErrorCode = 'INTERROGATION_LLM_FAILED';
      let lastErrorMessage = 'OpenAI did not return a safe structured response';
      let httpStatus: number | null = null;
      let providerCode: string | null = null;
      for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
        usedAttempts = attempt;
        const prompt = buildInterrogationPrompt(input.question, questionType, guardedKnowledge, presentedEvidence, validationErrors);
        promptHash = createHash('sha256').update(prompt).digest('hex');
        const attemptStartedAt = Date.now();
        try {
          const generated = await interrogationLlm.generate(prompt);
          provider = generated.provider;
          model = generated.model;
          inputTokens = generated.inputTokens;
          outputTokens = generated.outputTokens;
          latencyMs += generated.latencyMs;
          validationErrors = validateGuardedResponse(generated.output, guardedKnowledge);
          if (validationErrors.length === 0) {
            accepted = generated.output;
            break;
          }
          lastErrorCode = validationErrors[0];
          lastErrorMessage = `Guard validation failed: ${validationErrors.join(', ')}`;
        } catch (error) {
          latencyMs += Date.now() - attemptStartedAt;
          validationErrors = ['STRUCTURED_OUTPUT_INVALID'];
          lastErrorCode = 'INTERROGATION_LLM_FAILED';
          lastErrorMessage = error instanceof Error ? error.message : 'Unknown OpenAI error';
          if (error instanceof InterrogationLlmError) {
            httpStatus = error.status;
            providerCode = error.providerCode;
          }
        }
      }
      if (!accepted) {
        await safeLog({
          sessionId, userId, requestId: input.requestId, provider: 'openai', model, promptHash,
          inputTokens, outputTokens, latencyMs, status: 'FAILED', errorCode: lastErrorCode,
          errorMessage: lastErrorMessage, httpStatus, providerCode, attempt: usedAttempts,
          stage: 'LLM_RESULT_VALIDATION', questionType, suspectId: input.suspectId
        });
        throw new AppError(502, 'Could not generate a safe interrogation response', lastErrorCode === 'INTERROGATION_LLM_FAILED' ? lastErrorCode : 'INTERROGATION_RESPONSE_INVALID');
      }
      response = accepted;
    }

    try {
      const responseMetadata: Json = {
        provider, model, retryCount: Math.max(usedAttempts - 1, 0), validationStatus: 'valid',
        characterConsistencyStatus: response.characterConsistencyStatus,
        validationNotes: response.validationNotes
      };
      const result = await repository.finalize({
        userId, sessionId, requestId: input.requestId, suspectId: input.suspectId,
        question: input.question, questionType, response, presentedEvidenceIds, responseMetadata
      });
      const clues = await repository.findCluesByIds(result.newClueIds ?? []);
      await safeLog({
        sessionId, userId, requestId: input.requestId, provider, model, promptHash, inputTokens, outputTokens,
        latencyMs, status: 'COMPLETED', errorCode: null, errorMessage: null, httpStatus: null,
        providerCode: null, attempt: usedAttempts, stage: 'SESSION_UPDATE', questionType, suspectId: input.suspectId
      });
      return toAskResponse(result.message, result.remainingQuestions, clues);
    } catch (error) {
      await safeLog({
        sessionId, userId, requestId: input.requestId, provider, model, promptHash, inputTokens, outputTokens,
        latencyMs, status: 'FAILED', errorCode: 'INTERROGATION_FINALIZE_FAILED',
        errorMessage: error instanceof Error ? error.message.slice(0, 500) : 'Unknown finalize error',
        httpStatus: null, providerCode: null, attempt: usedAttempts,
        stage: 'MESSAGE_PERSIST', questionType, suspectId: input.suspectId
      });
      return mapRpcError(error);
    }
  },

  async list(sessionId: string, userId: string, suspectId?: string): Promise<InterrogationMessageDto[]> {
    await ownedSession(sessionId, userId);
    if (suspectId && await repository.getSuspectQuestionCount(sessionId, suspectId) === null) {
      throw new AppError(400, 'Suspect not in episode', 'SUSPECT_NOT_IN_EPISODE');
    }
    return (await repository.list(sessionId, suspectId)).map(toInterrogationDto);
  }
};
