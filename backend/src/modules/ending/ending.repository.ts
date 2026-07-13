import { serviceRoleClient } from '../../config/supabase.js';
import type { Json } from '../../shared/types/database.types.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type {
  DialectExplanation, EndingClue, EndingDto, EndingPerson, EndingResultRow,
  EvidenceConnection, OwnedEndingSession, ReportClaim, StoredReport, SuspectSecret
} from './ending.types.js';

const content = serviceRoleClient.schema('game_content');

function fail(error: { code?: string; message: string } | null): void {
  if (error) throw toAppError({ code: error.code ?? 'DATABASE_ERROR', message: error.message });
}

function object(value: Json): Record<string, Json | undefined> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function stringValue(value: Json | undefined): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function person(row: { id: string; code: string; name: string; age: number | null; occupation: string | null }): EndingPerson {
  return { id: row.id, code: row.code, name: row.name, age: row.age, occupation: row.occupation };
}

export const endingRepository = {
  async findOwnedSession(sessionId: string, userId: string): Promise<OwnedEndingSession | null> {
    const { data, error } = await serviceRoleClient.from('game_sessions')
      .select('id, episode_id, status').eq('id', sessionId).eq('user_id', userId).maybeSingle();
    fail(error);
    return data;
  },

  async findResult(sessionId: string): Promise<EndingResultRow | null> {
    const { data, error } = await serviceRoleClient.from('game_results')
      .select('id, selected_suspect_id, is_correct, ending_id, result_data, report_text, aftermath_text, report_status, report_generated_at')
      .eq('session_id', sessionId).maybeSingle();
    fail(error);
    return data as EndingResultRow | null;
  },

  async loadEnding(session: OwnedEndingSession, result: EndingResultRow): Promise<EndingDto | null> {
    if (!result.ending_id) return null;
    const [{ data: episode, error: episodeError }, { data: ending, error: endingError }] = await Promise.all([
      content.from('episodes').select('id, region_id, code, title, culprit_suspect_id').eq('id', session.episode_id).maybeSingle(),
      content.from('endings').select('id, code, ending_type, title, narrative, asset_url').eq('id', result.ending_id).eq('episode_id', session.episode_id).maybeSingle()
    ]);
    fail(episodeError); fail(endingError);
    if (!episode || !ending || !episode.culprit_suspect_id) return null;

    const [suspectsResult, timelineResult, evidenceResult, cluesResult, acquiredResult, dialectResult] = await Promise.all([
      content.from('suspects').select('id, code, name, age, occupation, motive, profile').eq('episode_id', session.episode_id).order('sort_order'),
      content.from('episode_timelines').select('occurred_at, title, description, sort_order').eq('episode_id', session.episode_id).order('sort_order'),
      content.from('evidence').select('id, code, title, description, sort_order').eq('episode_id', session.episode_id).order('sort_order'),
      content.from('clues').select('id, code, title, description, clue_type, sort_order').eq('episode_id', session.episode_id).order('sort_order'),
      serviceRoleClient.from('session_clues').select('clue_id').eq('session_id', session.id),
      content.from('dialect_expressions').select('code, dialect_text, standard_text, meaning, usage_context, difficulty').eq('region_id', episode.region_id).order('difficulty')
    ]);
    for (const error of [suspectsResult.error, timelineResult.error, evidenceResult.error, cluesResult.error, acquiredResult.error, dialectResult.error]) fail(error);

    const suspects = suspectsResult.data ?? [];
    const clues = cluesResult.data ?? [];
    const suspectIds = suspects.map((item) => item.id);
    const clueIds = clues.map((item) => item.id);
    const [{ data: conditions, error: conditionsError }, { data: facts, error: factsError }, { data: lies, error: liesError }] = await Promise.all([
      clueIds.length ? content.from('clue_unlock_conditions').select('clue_id, condition_data').in('clue_id', clueIds) : Promise.resolve({ data: [], error: null }),
      suspectIds.length ? content.from('suspect_facts').select('suspect_id, content, sort_order').in('suspect_id', suspectIds).order('sort_order') : Promise.resolve({ data: [], error: null }),
      suspectIds.length ? content.from('suspect_lies').select('suspect_id, claim, truth, exposure_data').in('suspect_id', suspectIds) : Promise.resolve({ data: [], error: null })
    ]);
    fail(conditionsError); fail(factsError); fail(liesError);
    const selected = suspects.find((item) => item.id === result.selected_suspect_id);
    const culprit = suspects.find((item) => item.id === episode.culprit_suspect_id);
    if (!selected || !culprit) return null;
    const clueById = new Map(clues.map((clue) => [clue.id, clue]));
    const acquiredIds = new Set((acquiredResult.data ?? []).map((item) => item.clue_id));
    const evidenceConnections: EvidenceConnection[] = (evidenceResult.data ?? []).map((evidence) => ({
      id: evidence.id, code: evidence.code, title: evidence.title, description: evidence.description,
      relatedClues: (conditions ?? []).filter((condition) => stringValue(object(condition.condition_data).evidence_id) === evidence.id)
        .map((condition) => clueById.get(condition.clue_id)).filter((clue): clue is NonNullable<typeof clue> => Boolean(clue))
        .map((clue) => ({ id: clue.id, code: clue.code, title: clue.title }))
    }));
    const suspectSecrets: SuspectSecret[] = suspects.map((suspect) => ({
      suspect: person(suspect),
      facts: (facts ?? []).filter((fact) => fact.suspect_id === suspect.id).map((fact) => fact.content),
      lies: (lies ?? []).filter((lie) => lie.suspect_id === suspect.id).map((lie) => ({
        claim: lie.claim, truth: lie.truth, reason: stringValue(object(lie.exposure_data).reason)
      }))
    }));
    const profile = object(culprit.profile);
    const missedCoreClues: EndingClue[] = clues.filter((clue) => clue.clue_type === 'CORE' && !acquiredIds.has(clue.id))
      .map((clue) => ({ id: clue.id, code: clue.code, title: clue.title, description: clue.description }));
    const dialectExplanations: DialectExplanation[] = (dialectResult.data ?? []).map((dialect) => ({
      code: dialect.code, dialectText: dialect.dialect_text, standardText: dialect.standard_text,
      meaning: dialect.meaning ?? dialect.standard_text, usageContext: dialect.usage_context
    }));

    return {
      endingType: result.is_correct ? 'TRUE' : ending.code.endsWith('-WRONG_FALLBACK') ? 'WRONG_FALLBACK' : 'FALSE',
      title: ending.title,
      fixedContent: ending.narrative,
      assetUrl: ending.asset_url,
      selectedSuspect: person(selected),
      actualCulprit: person(culprit),
      fullTimeline: (timelineResult.data ?? []).map((item) => ({ occurredAt: item.occurred_at, title: item.title, description: item.description })),
      motive: culprit.motive ?? stringValue(profile.motive),
      crimeMethod: stringValue(profile.crimeMethod) ?? stringValue(profile.crime_method),
      evidenceConnections,
      suspectSecrets,
      missedCoreClues,
      dialectExplanations,
      reportText: result.report_text,
      aftermathText: result.aftermath_text,
      reportGeneratedAt: result.report_generated_at
    };
  },

  async claimReport(sessionId: string, userId: string): Promise<ReportClaim> {
    const { data, error } = await serviceRoleClient.rpc('claim_ending_report_generation', { p_user_id: userId, p_session_id: sessionId });
    if (error) throw new Error(error.message);
    return data as unknown as ReportClaim;
  },

  async completeReport(sessionId: string, userId: string, reportText: string, aftermathText: string): Promise<StoredReport> {
    const { data, error } = await serviceRoleClient.rpc('complete_ending_report_generation', {
      p_user_id: userId, p_session_id: sessionId, p_report_text: reportText, p_aftermath_text: aftermathText
    });
    if (error) throw new Error(error.message);
    return data as unknown as StoredReport;
  },

  async failReport(sessionId: string, userId: string): Promise<void> {
    const { error } = await serviceRoleClient.rpc('fail_ending_report_generation', { p_user_id: userId, p_session_id: sessionId });
    if (error) throw toAppError(error);
  },

  async logReport(input: { sessionId: string; userId: string; requestId: string; model: string; promptHash: string; inputTokens: number | null; outputTokens: number | null; latencyMs: number; status: string; errorCode: string | null }): Promise<void> {
    const { error } = await serviceRoleClient.schema('game_private').from('llm_request_logs').insert({
      session_id: input.sessionId, user_id: input.userId, request_id: input.requestId, model: input.model,
      purpose: 'ENDING_REPORT', prompt_hash: input.promptHash, input_tokens: input.inputTokens,
      output_tokens: input.outputTokens, latency_ms: input.latencyMs, status: input.status, error_code: input.errorCode
    });
    fail(error);
  }
};
