import { serviceRoleClient } from '../../config/supabase.js';
import type { Json } from '../../shared/types/database.types.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { OwnedSession, StructuredInterrogationResponse, SuspectKnowledge } from './interrogation.types.js';

const messageColumns = 'id, session_id, suspect_id, request_id, question, dialect_response, response_metadata, created_at';
type MessageRow = {
  id: string; session_id: string; suspect_id: string; request_id: string; question: string;
  dialect_response: string | null; response_metadata: Json; created_at: string;
};

function throwIfError(error: { message: string; code?: string } | null): void {
  if (error) throw toAppError({ message: error.message, code: error.code ?? 'DATABASE_ERROR' });
}

export const interrogationRepository = {
  async findOwnedSession(sessionId: string, userId: string): Promise<OwnedSession | null> {
    const { data, error } = await serviceRoleClient.from('game_sessions')
      .select('id, user_id, episode_id, difficulty_config_id, status, remaining_questions, expires_at, current_suspect_id')
      .eq('id', sessionId).eq('user_id', userId).maybeSingle();
    throwIfError(error);
    return data as OwnedSession | null;
  },

  async findByRequest(sessionId: string, requestId: string): Promise<MessageRow | null> {
    const { data, error } = await serviceRoleClient.from('interrogation_messages')
      .select(messageColumns).eq('session_id', sessionId).eq('request_id', requestId).maybeSingle();
    throwIfError(error);
    return data as MessageRow | null;
  },

  async getQuestionsPerSuspect(difficultyConfigId: string): Promise<number | null> {
    const { data, error } = await serviceRoleClient.schema('game_content').from('episode_difficulty_configs')
      .select('questions_per_suspect').eq('id', difficultyConfigId).maybeSingle();
    throwIfError(error);
    return data?.questions_per_suspect ?? null;
  },

  async loadKnowledge(session: OwnedSession, suspectId: string): Promise<SuspectKnowledge | null> {
    const content = serviceRoleClient.schema('game_content');
    const [suspectResult, factsResult, liesResult, responseRulesResult, emotionRulesResult, stateResult, episodeResult, previousResult, evidenceIdsResult] = await Promise.all([
      content.from('suspects').select('id, episode_id, name, age, occupation, personality, speech_style, public_profile').eq('id', suspectId).eq('episode_id', session.episode_id).maybeSingle(),
      content.from('suspect_facts').select('id, content, is_public').eq('suspect_id', suspectId).order('sort_order'),
      content.from('suspect_lies').select('claim, truth').eq('suspect_id', suspectId),
      content.from('suspect_response_rules').select('rule_type, trigger_data, response_guidance').eq('suspect_id', suspectId).order('priority', { ascending: false }),
      content.from('suspect_emotion_rules').select('trigger_type, trigger_data, emotion, intensity').eq('suspect_id', suspectId),
      serviceRoleClient.from('session_suspect_states').select('emotion, questions_asked, state').eq('session_id', session.id).eq('suspect_id', suspectId).maybeSingle(),
      content.from('episodes').select('region_id, location').eq('id', session.episode_id).maybeSingle(),
      serviceRoleClient.from('interrogation_messages').select('question, dialect_response, response_metadata').eq('session_id', session.id).eq('suspect_id', suspectId).eq('status', 'completed').order('created_at').limit(20),
      serviceRoleClient.from('session_evidence').select('evidence_id').eq('session_id', session.id)
    ]);
    for (const result of [suspectResult, factsResult, liesResult, responseRulesResult, emotionRulesResult, stateResult, episodeResult, previousResult, evidenceIdsResult]) throwIfError(result.error);
    if (!suspectResult.data || !stateResult.data || !episodeResult.data) return null;

    const evidenceIds = (evidenceIdsResult.data ?? []).map((row) => row.evidence_id);
    const [dialectResult, victimResult, evidenceResult] = await Promise.all([
      content.from('dialect_expressions').select('standard_text, dialect_text, usage_context').eq('region_id', episodeResult.data.region_id).order('difficulty'),
      content.from('victims').select('name').eq('episode_id', session.episode_id).maybeSingle(),
      evidenceIds.length
        ? content.from('evidence').select('title').eq('episode_id', session.episode_id).in('id', evidenceIds)
        : Promise.resolve({ data: [], error: null })
    ]);
    throwIfError(dialectResult.error); throwIfError(victimResult.error); throwIfError(evidenceResult.error);

    const stateJson = stateResult.data.state;
    const revealed = typeof stateJson === 'object' && stateJson !== null && !Array.isArray(stateJson)
      ? stateJson.revealedFactIds : undefined;
    const knownEntities = [
      suspectResult.data.name,
      victimResult.data?.name,
      episodeResult.data.location,
      ...(evidenceResult.data ?? []).map((row) => row.title)
    ].filter((value): value is string => Boolean(value));

    return {
      suspect: {
        id: suspectResult.data.id,
        name: suspectResult.data.name,
        age: suspectResult.data.age,
        occupation: suspectResult.data.occupation,
        personality: suspectResult.data.personality,
        speechStyle: suspectResult.data.speech_style,
        publicProfile: suspectResult.data.public_profile
      },
      facts: (factsResult.data ?? []).map((row) => ({ id: row.id, content: row.content, isPublic: row.is_public })),
      lies: (liesResult.data ?? []).map((row) => ({ claim: row.claim, truth: row.truth })),
      responseRules: (responseRulesResult.data ?? []).map((row) => ({ ruleType: row.rule_type, trigger: row.trigger_data, guidance: row.response_guidance })),
      emotionRules: (emotionRulesResult.data ?? []).map((row) => ({ triggerType: row.trigger_type, trigger: row.trigger_data, emotion: row.emotion, intensity: row.intensity })),
      dialectExpressions: (dialectResult.data ?? []).map((row) => ({ standardText: row.standard_text, dialectText: row.dialect_text, usageContext: row.usage_context })),
      previousMessages: (previousResult.data ?? []).map((row) => ({ question: row.question, response: row.dialect_response ?? '', metadata: row.response_metadata })),
      currentEmotion: stateResult.data.emotion,
      revealedFactIds: Array.isArray(revealed) ? revealed.filter((id): id is string => typeof id === 'string') : [],
      knownEntities
    };
  },

  async getSuspectQuestionCount(sessionId: string, suspectId: string): Promise<number | null> {
    const { data, error } = await serviceRoleClient.from('session_suspect_states')
      .select('questions_asked').eq('session_id', sessionId).eq('suspect_id', suspectId).maybeSingle();
    throwIfError(error);
    return data?.questions_asked ?? null;
  },

  async finalize(input: {
    userId: string; sessionId: string; requestId: string; suspectId: string; question: string;
    questionType: string; response: StructuredInterrogationResponse;
  }): Promise<{ duplicate: boolean; message: MessageRow }> {
    const { data, error } = await serviceRoleClient.rpc('finalize_interrogation', {
      p_user_id: input.userId,
      p_session_id: input.sessionId,
      p_request_id: input.requestId,
      p_suspect_id: input.suspectId,
      p_question: input.question,
      p_dialect_response: input.response.dialectResponse,
      p_question_type: input.questionType,
      p_emotion: input.response.emotion,
      p_used_fact_ids: input.response.usedFactIds,
      p_evasion_type: input.response.evasionType,
      p_consistency_status: input.response.consistencyStatus
    });
    throwIfError(error);
    return data as unknown as { duplicate: boolean; message: MessageRow };
  },

  async logLlm(input: {
    sessionId: string; userId: string; requestId: string; model: string; promptHash: string | null;
    inputTokens: number | null; outputTokens: number | null; latencyMs: number | null; status: string; errorCode: string | null;
  }): Promise<void> {
    const { error } = await serviceRoleClient.schema('game_private').from('llm_request_logs').upsert({
      session_id: input.sessionId,
      user_id: input.userId,
      request_id: input.requestId,
      model: input.model,
      purpose: 'INTERROGATION',
      prompt_hash: input.promptHash,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      latency_ms: input.latencyMs,
      status: input.status,
      error_code: input.errorCode
    }, { onConflict: 'session_id,request_id' });
    throwIfError(error);
  },

  async list(sessionId: string, suspectId?: string): Promise<MessageRow[]> {
    let query = serviceRoleClient.from('interrogation_messages').select(messageColumns)
      .eq('session_id', sessionId).eq('status', 'completed').order('created_at');
    if (suspectId) query = query.eq('suspect_id', suspectId);
    const { data, error } = await query;
    throwIfError(error);
    return (data ?? []) as MessageRow[];
  }
};

export type { MessageRow };
