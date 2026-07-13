import { serviceRoleClient } from '../../config/supabase.js';
import type { Json } from '../../shared/types/database.types.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { CaseOverview, DialectRecord, NoteDto, NoteInput, NotePatch, OwnedRecordSession, RecordClue, RecordEvidence, RelationshipRecord, Testimony, TimelineEntry } from './record.types.js';

function fail(error: { code: string; message: string } | null): void { if (error) throw toAppError(error); }
const content = serviceRoleClient.schema('game_content');

function noteDto(row: { id: string; session_id: string; note_type: string; content: string; suspect_id: string | null; related_ref: Json; created_at: string; updated_at: string }): NoteDto {
  return { id: row.id, sessionId: row.session_id, noteType: row.note_type as NoteDto['noteType'], content: row.content, suspectId: row.suspect_id, relatedRef: row.related_ref, createdAt: row.created_at, updatedAt: row.updated_at };
}

export const recordRepository = {
  async findOwnedSession(sessionId: string, userId: string): Promise<OwnedRecordSession | null> {
    const { data, error } = await serviceRoleClient.from('game_sessions').select('id, user_id, episode_id, status').eq('id', sessionId).eq('user_id', userId).maybeSingle();
    fail(error); return data;
  },

  async findOverview(episodeId: string): Promise<{ overview: CaseOverview; regionId: string }> {
    const [episodeResult, victimResult] = await Promise.all([
      content.from('episodes').select('id, region_id, code, title, location, incident_type, synopsis, status').eq('id', episodeId).single(),
      content.from('victims').select('name, age, occupation').eq('episode_id', episodeId).maybeSingle()
    ]);
    fail(episodeResult.error); fail(victimResult.error);
    const episode = episodeResult.data!;
    return { regionId: episode.region_id, overview: { id: episode.id, code: episode.code, title: episode.title, location: episode.location, incidentType: episode.incident_type, synopsis: episode.synopsis, status: episode.status, victim: victimResult.data } };
  },

  async acquiredClueIds(sessionId: string): Promise<string[]> {
    const { data, error } = await serviceRoleClient.from('session_clues').select('clue_id').eq('session_id', sessionId);
    fail(error); return (data ?? []).map((row) => row.clue_id);
  },

  async findEvidence(sessionId: string, episodeId: string): Promise<RecordEvidence[]> {
    const { data: states, error: stateError } = await serviceRoleClient.from('session_evidence').select('evidence_id, viewed_at').eq('session_id', sessionId).not('viewed_at','is',null);
    fail(stateError); if (!states?.length) return [];
    const { data, error } = await content.from('evidence').select('id, code, title, description, evidence_type, sort_order').eq('episode_id', episodeId).in('id', states.map((row) => row.evidence_id)).order('sort_order');
    fail(error); const viewed = new Map(states.map((row) => [row.evidence_id, row.viewed_at!]));
    return (data ?? []).map((row) => ({ id: row.id, code: row.code, title: row.title, description: row.description, evidenceType: row.evidence_type, viewedAt: viewed.get(row.id)! }));
  },

  async findTestimonies(sessionId: string, episodeId: string): Promise<Testimony[]> {
    const { data: messages, error } = await serviceRoleClient.from('interrogation_messages').select('id, suspect_id, question, dialect_response, response_metadata, created_at').eq('session_id', sessionId).eq('status','completed').order('created_at');
    fail(error); if (!messages?.length) return [];
    const suspectIds = [...new Set(messages.map((row) => row.suspect_id))];
    const { data: suspects, error: suspectError } = await content.from('suspects').select('id, name').eq('episode_id', episodeId).in('id', suspectIds);
    fail(suspectError); const names = new Map((suspects ?? []).map((row) => [row.id, row.name]));
    return messages.filter((row) => names.has(row.suspect_id)).map((row) => {
      const metadata = typeof row.response_metadata === 'object' && row.response_metadata !== null && !Array.isArray(row.response_metadata) ? row.response_metadata : {};
      return { id: row.id, suspectId: row.suspect_id, suspectName: names.get(row.suspect_id)!, question: row.question, response: row.dialect_response ?? '', questionType: typeof metadata.questionType === 'string' ? metadata.questionType : null, emotion: typeof metadata.emotion === 'string' ? metadata.emotion : null, createdAt: row.created_at };
    });
  },

  async findTimeline(episodeId: string, clueIds: string[]): Promise<TimelineEntry[]> {
    const publicQuery = content.from('episode_timelines').select('id, occurred_at, title, description, sort_order').eq('episode_id', episodeId).eq('visibility','PUBLIC_INITIAL');
    const unlockedQuery = clueIds.length ? content.from('episode_timelines').select('id, occurred_at, title, description, sort_order').eq('episode_id', episodeId).eq('visibility','CLUE_UNLOCKED').in('unlock_clue_id', clueIds) : Promise.resolve({ data: [], error: null });
    const [publicResult, unlockedResult] = await Promise.all([publicQuery, unlockedQuery]); fail(publicResult.error); fail(unlockedResult.error);
    return [...(publicResult.data ?? []), ...(unlockedResult.data ?? [])].sort((a,b) => a.sort_order-b.sort_order).map((row) => ({ id: row.id, occurredAt: row.occurred_at, title: row.title, description: row.description }));
  },

  async findClues(sessionId: string, episodeId: string): Promise<RecordClue[]> {
    const { data: states, error: stateError } = await serviceRoleClient.from('session_clues').select('clue_id, unlocked_at').eq('session_id', sessionId);
    fail(stateError); if (!states?.length) return [];
    const { data, error } = await content.from('clues').select('id, code, title, description, clue_type, sort_order').eq('episode_id', episodeId).in('id', states.map((row) => row.clue_id)).order('sort_order');
    fail(error); const unlocked = new Map(states.map((row) => [row.clue_id,row.unlocked_at]));
    return (data ?? []).map((row) => ({ id: row.id, code: row.code, title: row.title, description: row.description, clueType: row.clue_type, unlockedAt: unlocked.get(row.id)! }));
  },

  async findDialects(regionId: string, revealMeaning: boolean): Promise<DialectRecord[]> {
    const { data, error } = await content.from('dialect_expressions').select('id, code, dialect_text, standard_text, meaning, usage_context, difficulty').eq('region_id', regionId).order('difficulty');
    fail(error); return (data ?? []).map((row) => ({ id: row.id, code: row.code, dialectText: row.dialect_text, usageContext: row.usage_context, ...(revealMeaning ? { standardMeaning: row.meaning ?? row.standard_text } : {}) }));
  },

  async findRelationships(episodeId: string, clueIds: string[]): Promise<RelationshipRecord[]> {
    const { data: episodeSuspects, error: suspectError } = await content.from('suspects').select('id, name').eq('episode_id', episodeId);
    fail(suspectError); const suspectMap = new Map((episodeSuspects ?? []).map((row) => [row.id,row.name])); if (!suspectMap.size) return [];
    const suspectIds = [...suspectMap.keys()];
    const publicQuery = content.from('suspect_relationships').select('id, suspect_id, related_suspect_id, victim_id, relationship_type, description').in('suspect_id', suspectIds).eq('visibility','PUBLIC');
    const unlockedQuery = clueIds.length ? content.from('suspect_relationships').select('id, suspect_id, related_suspect_id, victim_id, relationship_type, description').in('suspect_id', suspectIds).eq('visibility','CLUE_UNLOCKED').in('unlock_clue_id', clueIds) : Promise.resolve({ data: [], error: null });
    const [publicResult, unlockedResult, victimResult] = await Promise.all([publicQuery, unlockedQuery, content.from('victims').select('id, name').eq('episode_id', episodeId).maybeSingle()]);
    fail(publicResult.error); fail(unlockedResult.error); fail(victimResult.error);
    const victim = victimResult.data;
    return [...(publicResult.data ?? []), ...(unlockedResult.data ?? [])].filter((row) => suspectMap.has(row.suspect_id) && (!row.related_suspect_id || suspectMap.has(row.related_suspect_id)) && (!row.victim_id || row.victim_id === victim?.id)).map((row) => ({ id: row.id, suspect: { id: row.suspect_id, name: suspectMap.get(row.suspect_id)! }, relationshipType: row.relationship_type, description: row.description, relatedSuspect: row.related_suspect_id ? { id: row.related_suspect_id, name: suspectMap.get(row.related_suspect_id)! } : null, victim: row.victim_id && victim ? { id: victim.id, name: victim.name } : null }));
  },

  async findNotes(sessionId: string, userId: string): Promise<NoteDto[]> {
    const { data, error } = await serviceRoleClient.from('session_notes').select('id, session_id, note_type, content, suspect_id, related_ref, created_at, updated_at').eq('session_id', sessionId).eq('user_id', userId).order('updated_at',{ascending:false});
    fail(error); return (data ?? []).map(noteDto);
  },

  async suspectBelongs(episodeId: string, suspectId: string): Promise<boolean> {
    const { data, error } = await content.from('suspects').select('id').eq('id',suspectId).eq('episode_id',episodeId).maybeSingle(); fail(error); return Boolean(data);
  },

  async createNote(sessionId: string, userId: string, input: NoteInput): Promise<NoteDto> {
    const { data, error } = await serviceRoleClient.from('session_notes').insert({ session_id:sessionId, user_id:userId, note_type:input.noteType, content:input.content, suspect_id:input.suspectId, related_ref:input.relatedRef }).select('id, session_id, note_type, content, suspect_id, related_ref, created_at, updated_at').single();
    fail(error); return noteDto(data!);
  },

  async updateNote(sessionId: string, userId: string, noteId: string, patch: NotePatch): Promise<NoteDto | null> {
    const changes = { ...(patch.noteType !== undefined ? {note_type:patch.noteType}:{}), ...(patch.content !== undefined ? {content:patch.content}:{}), ...(patch.suspectId !== undefined ? {suspect_id:patch.suspectId}:{}), ...(patch.relatedRef !== undefined ? {related_ref:patch.relatedRef}:{}), updated_at:new Date().toISOString() };
    const { data, error } = await serviceRoleClient.from('session_notes').update(changes).eq('id',noteId).eq('session_id',sessionId).eq('user_id',userId).select('id, session_id, note_type, content, suspect_id, related_ref, created_at, updated_at').maybeSingle();
    fail(error); return data ? noteDto(data) : null;
  },

  async deleteNote(sessionId: string, userId: string, noteId: string): Promise<boolean> {
    const { data, error } = await serviceRoleClient.from('session_notes').delete().eq('id',noteId).eq('session_id',sessionId).eq('user_id',userId).select('id').maybeSingle(); fail(error); return Boolean(data);
  }
};
