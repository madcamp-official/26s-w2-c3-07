import { serviceRoleClient } from '../../config/supabase.js';
import type { Json } from '../../shared/types/database.types.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { OwnedSession, PresentedEvidence, PromptMetrics, QuestionType, StructuredInterrogationResponse, SuspectKnowledge, UnlockedClueDto, UnlockedEvidenceDto } from './interrogation.types.js';

const messageColumns = 'id, session_id, suspect_id, request_id, user_question, question_type, npc_response, emotion_after, evasion_type, used_fact_refs, revealed_fact_refs, claimed_fact_refs, presented_evidence_refs, response_metadata, created_at';
type MessageRow = {
  id: string; session_id: string; suspect_id: string; request_id: string; user_question: string;
  question_type: string; npc_response: string; emotion_after: string | null; evasion_type: string | null;
  used_fact_refs: Json; revealed_fact_refs: Json; claimed_fact_refs: Json; presented_evidence_refs: Json;
  response_metadata: Json; created_at: string;
};

const stringArray = (value: Json): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === 'string')
  : [];

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

  async loadKnowledge(session: OwnedSession, suspectId: string, questionType: QuestionType): Promise<SuspectKnowledge | null> {
    const content = serviceRoleClient.schema('game_content');
    const needsLies = ['Q-CONTRADICTION', 'Q-ACCUSATION', 'Q-EVIDENCE'].includes(questionType);
    const needsRelationships = questionType === 'Q-RELATION';
    const [suspectResult, factsResult, responseRuleResult, emotionRulesResult, relationshipsResult, stateResult, episodeResult, configResult, previousResult, victimResult] = await Promise.all([
      content.from('suspects').select('id, episode_id, name, age, occupation, personality, speech_style, public_profile').eq('id', suspectId).eq('episode_id', session.episode_id).maybeSingle(),
      content.from('suspect_facts').select('id, code, fact_type, content, disclosure_level').eq('suspect_id', suspectId).order('priority', { ascending: false }),
      content.from('suspect_response_rules').select('question_type, response_policy, allowed_fact_refs, hidden_fact_refs, difficulty_overrides').eq('suspect_id', suspectId).eq('question_type', questionType).limit(1),
      content.from('suspect_emotion_rules').select('trigger_type, condition, to_emotion, priority').eq('suspect_id', suspectId).order('priority', { ascending: false }).limit(3),
      needsRelationships
        ? content.from('suspect_relationships').select('target_suspect_id, relation_type, public_description').eq('source_suspect_id', suspectId).eq('disclosure_level', 'PUBLIC_PROFILE').limit(3)
        : Promise.resolve({ data: [], error: null }),
      serviceRoleClient.from('session_suspect_states').select('current_emotion, questions_used').eq('session_id', session.id).eq('suspect_id', suspectId).maybeSingle(),
      content.from('episodes').select('region_id, location').eq('id', session.episode_id).maybeSingle(),
      content.from('episode_difficulty_configs').select('difficulty, dialect_level').eq('id', session.difficulty_config_id).eq('episode_id', session.episode_id).maybeSingle(),
      serviceRoleClient.from('interrogation_messages').select('user_question, npc_response, revealed_fact_refs, claimed_fact_refs').eq('session_id', session.id).eq('suspect_id', suspectId).order('created_at', { ascending: false }).limit(3),
      content.from('victims').select('name').eq('episode_id', session.episode_id).maybeSingle()
    ]);
    for (const result of [suspectResult, factsResult, responseRuleResult, emotionRulesResult, relationshipsResult, stateResult, episodeResult, configResult, previousResult, victimResult]) throwIfError(result.error);
    if (!suspectResult.data || !stateResult.data || !episodeResult.data || !configResult.data) return null;

    const fallbackRuleResult = (responseRuleResult.data ?? []).length === 0 && questionType !== 'Q-OTHER'
      ? await content.from('suspect_response_rules').select('question_type, response_policy, allowed_fact_refs, hidden_fact_refs, difficulty_overrides').eq('suspect_id', suspectId).eq('question_type', 'Q-OTHER').limit(1)
      : { data: [], error: null };
    throwIfError(fallbackRuleResult.error);
    const responseRules = (responseRuleResult.data ?? []).length ? responseRuleResult.data ?? [] : fallbackRuleResult.data ?? [];

    const dialectLimit = configResult.data.difficulty === 'easy' ? 5 : configResult.data.difficulty === 'hard' ? 10 : 7;
    const [dialectResult, liesResult] = await Promise.all([
      content.from('dialect_expressions')
        .select('code, standard_meaning, expression, difficulty_rules')
        .eq('episode_id', session.episode_id)
        .eq('is_post_ending_only', false)
        .in('difficulty_rules->>verification_status', ['APPROVED_FOR_MVP', 'VERIFIED'])
        .order('display_order')
        .limit(30),
      needsLies
        ? content.from('suspect_lies').select('claimed_content, true_content').eq('suspect_id', suspectId).limit(2)
        : Promise.resolve({ data: [], error: null })
    ]);
    throwIfError(dialectResult.error); throwIfError(liesResult.error);

    const previousRows = [...(previousResult.data ?? [])].reverse();
    const revealed = previousRows.flatMap((row) => stringArray(row.revealed_fact_refs));
    const claimed = previousRows.flatMap((row) => stringArray(row.claimed_fact_refs));
    const knownEntities = [
      suspectResult.data.name,
      victimResult.data?.name,
      episodeResult.data.location
    ].filter((value): value is string => Boolean(value));

    const dialectRows = (dialectResult.data ?? []).map((row) => {
      const rules = typeof row.difficulty_rules === 'object' && row.difficulty_rules !== null && !Array.isArray(row.difficulty_rules)
        ? row.difficulty_rules as Record<string, Json> : {};
      return {
        code: row.code,
        standardText: row.standard_meaning,
        dialectText: row.expression,
        category: typeof rules.category === 'string' ? rules.category : 'VOCABULARY',
        intensity: typeof rules.intensity === 'number' ? rules.intensity : 1,
        questionTypes: stringArray(rules.question_types ?? []),
        emotionTags: stringArray(rules.emotion_tags ?? []),
        verificationStatus: typeof rules.verification_status === 'string' ? rules.verification_status : ''
      };
    }).filter((row) => row.intensity <= configResult.data.dialect_level)
      .sort((a, b) => {
        const score = (row: typeof a) => (row.questionTypes.includes(questionType) ? 4 : 0)
          + (row.emotionTags.includes(stateResult.data.current_emotion) ? 2 : 0);
        return score(b) - score(a) || a.code.localeCompare(b.code);
      });

    const categoryCaps: Record<string, number> = { VOCABULARY: 2, ENDING: 2, FILLER: 1, EMOTION: 1, EVASION: 1 };
    const categoryCounts = new Map<string, number>();
    const dialectExpressions = dialectRows.filter((row) => {
      const cap = categoryCaps[row.category] ?? dialectLimit;
      const count = categoryCounts.get(row.category) ?? 0;
      if (count >= cap) return false;
      categoryCounts.set(row.category, count + 1);
      return true;
    }).slice(0, dialectLimit);

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
      facts: (factsResult.data ?? []).map((row) => ({ id: row.id, code: row.code, content: row.content, factType: row.fact_type, disclosureLevel: row.disclosure_level })),
      lies: (liesResult.data ?? []).map((row) => ({ claim: row.claimed_content, truth: row.true_content })),
      responseRules: responseRules.map((row) => ({
        ruleType: row.question_type,
        trigger: row.difficulty_overrides,
        guidance: row.response_policy,
        allowedFactRefs: stringArray(row.allowed_fact_refs),
        hiddenFactRefs: stringArray(row.hidden_fact_refs)
      })),
      emotionRules: (emotionRulesResult.data ?? []).map((row) => ({ triggerType: row.trigger_type, trigger: row.condition, emotion: row.to_emotion, intensity: row.priority })),
      dialectExpressions,
      relationships: (relationshipsResult.data ?? []).map((row) => ({ targetSuspectId: row.target_suspect_id ?? '', relationshipType: row.relation_type, publicDescription: row.public_description })),
      previousMessages: previousRows.map((row) => ({ question: row.user_question, response: row.npc_response })),
      currentEmotion: stateResult.data.current_emotion,
      difficulty: configResult.data.difficulty,
      dialectLevel: configResult.data.dialect_level,
      revealedFactIds: [...new Set(revealed)],
      claimedFactIds: [...new Set(claimed)],
      knownEntities
    };
  },

  async findPresentedEvidence(session: OwnedSession, evidenceIds: string[]): Promise<PresentedEvidence[]> {
    if (evidenceIds.length === 0) return [];
    const { data: acquired, error: acquiredError } = await serviceRoleClient.from('session_evidence')
      .select('evidence_id').eq('session_id', session.id).in('evidence_id', evidenceIds);
    throwIfError(acquiredError);
    const acquiredIds = (acquired ?? []).map((row) => row.evidence_id);
    if (acquiredIds.length !== evidenceIds.length) return [];
    const { data, error } = await serviceRoleClient.schema('game_content').from('evidence')
      .select('id, code, title, description, evidence_type').eq('episode_id', session.episode_id).in('id', acquiredIds);
    throwIfError(error);
    return (data ?? []).map((row) => ({ id: row.id, code: row.code, title: row.title, description: row.description, evidenceType: row.evidence_type }));
  },

  async getSuspectQuestionCount(sessionId: string, suspectId: string): Promise<number | null> {
    const { data, error } = await serviceRoleClient.from('session_suspect_states')
      .select('questions_used').eq('session_id', sessionId).eq('suspect_id', suspectId).maybeSingle();
    throwIfError(error);
    return data?.questions_used ?? null;
  },

  async finalize(input: {
    userId: string; sessionId: string; requestId: string; suspectId: string; question: string;
    questionType: string; response: StructuredInterrogationResponse; presentedEvidenceIds: string[]; responseMetadata: Json;
  }): Promise<{ duplicate: boolean; message: MessageRow; newClueIds: string[]; newEvidenceIds: string[]; remainingQuestions: number }> {
    const { data, error } = await serviceRoleClient.rpc('finalize_interrogation', {
      p_user_id: input.userId,
      p_session_id: input.sessionId,
      p_request_id: input.requestId,
      p_suspect_id: input.suspectId,
      p_question: input.question,
      p_dialect_response: input.response.dialectResponse,
      p_question_type: input.questionType,
      p_emotion: input.response.emotionAfter,
      p_used_fact_ids: input.response.usedFactIds,
      p_revealed_fact_ids: input.response.revealedFactIds,
      p_claimed_fact_ids: input.response.claimedFactIds,
      p_presented_evidence_ids: input.presentedEvidenceIds,
      p_evasion_type: input.response.evasionType,
      p_consistency_status: input.response.characterConsistencyStatus,
      p_response_metadata: input.responseMetadata
    });
    throwIfError(error);
    return data as unknown as { duplicate: boolean; message: MessageRow; newClueIds: string[]; newEvidenceIds: string[]; remainingQuestions: number };
  },

  async findCluesByIds(clueIds: string[]): Promise<UnlockedClueDto[]> {
    if (clueIds.length === 0) return [];
    const { data, error } = await serviceRoleClient.schema('game_content').from('clues')
      .select('id, code, title, content, record_summary, clue_type, importance').in('id', clueIds);
    throwIfError(error);
    return (data ?? []).map((row) => ({ id: row.id, code: row.code, title: row.title, content: row.content, recordSummary: row.record_summary, clueType: row.clue_type, importance: row.importance }));
  },

  async findEvidenceByIds(episodeId: string, evidenceIds: string[]): Promise<UnlockedEvidenceDto[]> {
    if (evidenceIds.length === 0) return [];
    const { data, error } = await serviceRoleClient.schema('game_content').from('evidence')
      .select('id, code, title, description, evidence_type')
      .eq('episode_id', episodeId)
      .in('id', evidenceIds);
    throwIfError(error);
    return (data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      evidenceType: row.evidence_type
    }));
  },

  async logLlm(input: {
    sessionId: string; userId: string; requestId: string; provider: string; model: string; promptHash: string | null;
    inputTokens: number | null; outputTokens: number | null; cachedTokens: number | null; latencyMs: number | null; status: string; errorCode: string | null;
    errorMessage: string | null; httpStatus: number | null; providerCode: string | null; attempt: number; stage: string;
    questionType: string; suspectId: string; promptMetrics: PromptMetrics | null; localResponse: boolean;
    attempts: Array<{ attempt: number; promptTokens: number | null; completionTokens: number | null; cachedTokens: number | null; errorCode: string | null }>;
  }): Promise<void> {
    const status = input.status === 'COMPLETED' ? 'SUCCEEDED' : input.status === 'FAILED' ? 'FAILED' : 'STARTED';
    const { error } = await serviceRoleClient.schema('game_private').from('llm_request_logs').insert({
      session_id: input.sessionId,
      model: input.model,
      purpose: 'INTERROGATION',
      prompt_tokens: input.inputTokens,
      completion_tokens: input.outputTokens,
      latency_ms: input.latencyMs,
      status,
      error_code: input.errorCode,
      error_message: input.errorMessage,
      metadata: {
        userId: input.userId, requestId: input.requestId, promptHash: input.promptHash,
        provider: input.provider, httpStatus: input.httpStatus, providerCode: input.providerCode,
        retryCount: Math.max(input.attempt - 1, 0), questionType: input.questionType,
        suspectId: input.suspectId, validationStage: input.stage,
        cachedTokens: input.cachedTokens,
        totalTokens: input.inputTokens !== null && input.outputTokens !== null ? input.inputTokens + input.outputTokens : null,
        attemptCount: input.attempt,
        promptVersion: input.promptMetrics?.promptVersion ?? null,
        promptCharacterCount: input.promptMetrics?.characterCount ?? 0,
        includedFactCount: input.promptMetrics?.includedFactCount ?? 0,
        includedRuleCount: input.promptMetrics?.includedRuleCount ?? 0,
        includedDialectCount: input.promptMetrics?.includedDialectCount ?? 0,
        includedHistoryCount: input.promptMetrics?.includedHistoryCount ?? 0,
        localResponse: input.localResponse,
        attempts: input.attempts
      }
    });
    throwIfError(error);
  },

  async list(sessionId: string, suspectId?: string): Promise<MessageRow[]> {
    let query = serviceRoleClient.from('interrogation_messages').select(messageColumns)
      .eq('session_id', sessionId).order('created_at');
    if (suspectId) query = query.eq('suspect_id', suspectId);
    const { data, error } = await query;
    throwIfError(error);
    return (data ?? []) as MessageRow[];
  }
};

export type { MessageRow };
