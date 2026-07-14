import { createHash } from 'node:crypto';
import { AppError } from '../../shared/errors/app-error.js';
import { interrogationLlm } from './interrogation.llm.js';
import { buildInterrogationPrompt } from './interrogation.prompt.js';
import { interrogationRepository as repository, type MessageRow } from './interrogation.repository.js';
import { classifyQuestion, promptRejectionResponse, validateGuardedResponse } from './interrogation.guard.js';
import { QUESTION_TYPES, type InterrogationInput, type InterrogationMessageDto, type StructuredInterrogationResponse } from './interrogation.types.js';

const MAX_GENERATION_ATTEMPTS = 3;

function metadata(row: MessageRow): Record<string, unknown> {
  return typeof row.response_metadata === 'object' && row.response_metadata !== null && !Array.isArray(row.response_metadata)
    ? row.response_metadata as Record<string, unknown> : {};
}

export function toInterrogationDto(row: MessageRow): InterrogationMessageDto {
  const meta = metadata(row);
  const questionType = QUESTION_TYPES.includes(row.question_type as (typeof QUESTION_TYPES)[number])
    ? row.question_type as (typeof QUESTION_TYPES)[number] : 'Q-UNKNOWN';
  return {
    id: row.id,
    sessionId: row.session_id,
    suspectId: row.suspect_id,
    requestId: row.request_id,
    question: row.user_question,
    dialectResponse: row.npc_response,
    questionType,
    emotion: row.emotion_after as InterrogationMessageDto['emotion'] ?? 'NEUTRAL',
    usedFactIds: Array.isArray(row.used_fact_refs) ? row.used_fact_refs.filter((id): id is string => typeof id === 'string') : [],
    evasionType: row.evasion_type as InterrogationMessageDto['evasionType'] ?? 'UNKNOWN',
    consistencyStatus: meta.consistencyStatus === 'INVALID' ? 'INVALID' : 'VALID',
    createdAt: row.created_at
  };
}

const rpcErrors: Record<string, [number, string]> = {
  INTERROGATION_SESSION_NOT_FOUND: [404, 'SESSION_NOT_FOUND'],
  INTERROGATION_STATE_INVALID: [409, 'INTERROGATION_STATE_INVALID'],
  INTERROGATION_SESSION_EXPIRED: [409, 'SESSION_EXPIRED'],
  INTERROGATION_QUESTIONS_EXHAUSTED: [409, 'INTERROGATION_QUESTIONS_EXHAUSTED'],
  INTERROGATION_SUSPECT_NOT_SELECTED: [409, 'INTERROGATION_SUSPECT_NOT_SELECTED'],
  INTERROGATION_SUSPECT_NOT_IN_EPISODE: [400, 'SUSPECT_NOT_IN_EPISODE'],
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
  async ask(sessionId: string, userId: string, input: InterrogationInput): Promise<InterrogationMessageDto> {
    const session = await ownedSession(sessionId, userId);
    const duplicate = await repository.findByRequest(sessionId, input.requestId);
    if (duplicate) return toInterrogationDto(duplicate);
    if (session.status !== 'INTERROGATING') throw new AppError(409, 'Session is not interrogating', 'INTERROGATION_STATE_INVALID');
    if (new Date(session.expires_at).getTime() <= Date.now()) throw new AppError(409, 'Session expired', 'SESSION_EXPIRED');
    if (session.remaining_questions <= 0) throw new AppError(409, 'No questions remaining', 'INTERROGATION_QUESTIONS_EXHAUSTED');

    const [knowledge, questionsUsed, perSuspectLimit] = await Promise.all([
      repository.loadKnowledge(session, input.suspectId),
      repository.getSuspectQuestionCount(session.id, input.suspectId),
      repository.getQuestionsPerSuspect(session.difficulty_config_id)
    ]);
    if (!knowledge || questionsUsed === null) throw new AppError(400, 'Suspect not in episode', 'SUSPECT_NOT_IN_EPISODE');
    if (session.current_suspect_id !== input.suspectId) throw new AppError(409, 'Select this suspect first', 'INTERROGATION_SUSPECT_NOT_SELECTED');
    if (perSuspectLimit === null) throw new AppError(409, 'Difficulty configuration missing', 'INTERROGATION_STATE_INVALID');
    if (questionsUsed >= perSuspectLimit) throw new AppError(409, 'Suspect question limit reached', 'INTERROGATION_SUSPECT_LIMIT_REACHED');

    const questionType = classifyQuestion(input.question);
    let response: StructuredInterrogationResponse;
    let model = 'guarded-local';
    let inputTokens: number | null = 0;
    let outputTokens: number | null = 0;
    let latencyMs = 0;
    let promptHash: string | null = null;

    if (questionType === 'Q-PROMPT') {
      response = promptRejectionResponse(knowledge.currentEmotion);
    } else {
      let validationErrors: string[] = [];
      let accepted: StructuredInterrogationResponse | null = null;
      let lastErrorCode = 'INTERROGATION_LLM_FAILED';
      for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
        const prompt = buildInterrogationPrompt(input.question, questionType, knowledge, validationErrors);
        promptHash = createHash('sha256').update(prompt).digest('hex');
        const attemptStartedAt = Date.now();
        try {
          const generated = await interrogationLlm.generate(prompt);
          model = generated.model;
          inputTokens = generated.inputTokens;
          outputTokens = generated.outputTokens;
          latencyMs += generated.latencyMs;
          validationErrors = validateGuardedResponse(generated.output, knowledge);
          if (validationErrors.length === 0) {
            accepted = generated.output;
            break;
          }
          lastErrorCode = validationErrors[0];
        } catch {
          latencyMs += Date.now() - attemptStartedAt;
          validationErrors = ['STRUCTURED_OUTPUT_INVALID'];
          lastErrorCode = 'INTERROGATION_LLM_FAILED';
        }
      }
      if (!accepted) {
        await safeLog({ sessionId, userId, requestId: input.requestId, model, promptHash, inputTokens, outputTokens, latencyMs, status: 'FAILED', errorCode: lastErrorCode });
        throw new AppError(502, 'Could not generate a safe interrogation response', lastErrorCode === 'INTERROGATION_LLM_FAILED' ? lastErrorCode : 'INTERROGATION_RESPONSE_INVALID');
      }
      response = accepted;
    }

    try {
      const result = await repository.finalize({ userId, sessionId, requestId: input.requestId, suspectId: input.suspectId, question: input.question, questionType, response });
      await safeLog({ sessionId, userId, requestId: input.requestId, model, promptHash, inputTokens, outputTokens, latencyMs, status: 'COMPLETED', errorCode: null });
      return toInterrogationDto(result.message);
    } catch (error) {
      await safeLog({ sessionId, userId, requestId: input.requestId, model, promptHash, inputTokens, outputTokens, latencyMs, status: 'FAILED', errorCode: 'INTERROGATION_FINALIZE_FAILED' });
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
