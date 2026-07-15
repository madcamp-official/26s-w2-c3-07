import { serviceRoleClient } from '../../config/supabase.js';
import type { Json } from '../../shared/types/database.types.js';
import { toAppError } from '../../shared/utils/supabase.js';
import type { CaseOverview, DialectRecord, NoteDto, NoteInput, NotePatch, OwnedRecordSession, RecordClue, RecordEvidence, RelationshipRecord, Testimony, TimelineEntry } from './record.types.js';

function fail(error: { code: string; message: string } | null): void { if (error) throw toAppError(error); }
const content = serviceRoleClient.schema('game_content');

function noteDto(row: { id: string; session_id: string; note_type: string; content: string; suspect_id: string | null; related_ref: Json; created_at: string; updated_at: string }): NoteDto {
  const noteType = row.note_type === 'FREEFORM' ? 'FREE' : row.note_type as NoteDto['noteType'];
  return { id: row.id, sessionId: row.session_id, noteType, content: row.content, suspectId: row.suspect_id, relatedRef: row.related_ref, createdAt: row.created_at, updatedAt: row.updated_at };
}

const dbNoteType = (noteType: NoteInput['noteType']) => noteType === 'FREE' ? 'FREEFORM' : noteType;

export const recordRepository = {
  async findOwnedSession(sessionId: string, userId: string): Promise<OwnedRecordSession | null> {
    const { data, error } = await serviceRoleClient.from('game_sessions').select('id, user_id, episode_id, status').eq('id', sessionId).eq('user_id', userId).maybeSingle();
    fail(error); return data;
  },

  async findOverview(episodeId: string): Promise<{ overview: CaseOverview; regionId: string }> {
    const [episodeResult, victimResult] = await Promise.all([
      content.from('episodes').select('id, region_id, code, title, location, incident_type, synopsis, status').eq('id', episodeId).single(),
      content.from('victims').select('name, age, role').eq('episode_id', episodeId).maybeSingle()
    ]);
    fail(episodeResult.error); fail(victimResult.error);
    const episode = episodeResult.data!;
    const victim = victimResult.data ? { name: victimResult.data.name, age: victimResult.data.age, occupation: victimResult.data.role } : null;
    return { regionId: episode.region_id, overview: { id: episode.id, code: episode.code, title: episode.title, location: episode.location, incidentType: episode.incident_type, synopsis: episode.synopsis, status: episode.status, victim } };
  },

  async acquiredClueIds(sessionId: string): Promise<string[]> {
    const { data, error } = await serviceRoleClient.from('session_clues').select('clue_id').eq('session_id', sessionId);
    fail(error); return (data ?? []).map((row) => row.clue_id);
  },

  async findEvidence(sessionId: string, episodeId: string): Promise<RecordEvidence[]> {
    const { data: states, error: stateError } = await serviceRoleClient.from('session_evidence').select('evidence_id, viewed_at').eq('session_id', sessionId).not('viewed_at','is',null);
    fail(stateError); if (!states?.length) return [];
    const { data, error } = await content.from('evidence').select('id, code, title, description, evidence_type, display_order').eq('episode_id', episodeId).in('id', states.map((row) => row.evidence_id)).order('display_order');
    fail(error); const viewed = new Map(states.map((row) => [row.evidence_id, row.viewed_at!]));
    return (data ?? []).map((row) => ({ id: row.id, code: row.code, title: row.title, description: row.description, evidenceType: row.evidence_type, viewedAt: viewed.get(row.id)! }));
  },

  async findTestimonies(sessionId: string, episodeId: string): Promise<Testimony[]> {
    const { data: messages, error } = await serviceRoleClient.from('interrogation_messages').select('id, suspect_id, user_question, npc_response, question_type, emotion_after, created_at').eq('session_id', sessionId).order('created_at');
    fail(error); if (!messages?.length) return [];
    const suspectIds = [...new Set(messages.map((row) => row.suspect_id))];
    const { data: suspects, error: suspectError } = await content.from('suspects').select('id, name').eq('episode_id', episodeId).in('id', suspectIds);
    fail(suspectError); const names = new Map((suspects ?? []).map((row) => [row.id, row.name]));
    return messages.filter((row) => names.has(row.suspect_id)).map((row) => ({
      id: row.id, suspectId: row.suspect_id, suspectName: names.get(row.suspect_id)!,
      question: row.user_question, response: row.npc_response, questionType: row.question_type,
      emotion: row.emotion_after, createdAt: row.created_at
    }));
  },

  async findTimeline(episodeId: string, clueIds: string[]): Promise<TimelineEntry[]> {
    const { data, error } = await content.from('episode_timelines')
      .select('id, sequence_no, occurred_at_label, public_description, visibility, metadata')
      .eq('episode_id', episodeId).in('visibility', ['PUBLIC_INITIAL', 'SESSION_UNLOCKED']).order('sequence_no');
    fail(error);
    return (data ?? []).filter((row) => {
      if (row.visibility === 'PUBLIC_INITIAL') return true;
      const metadata = typeof row.metadata === 'object' && row.metadata !== null && !Array.isArray(row.metadata) ? row.metadata : {};
      return typeof metadata.unlockClueId === 'string' && clueIds.includes(metadata.unlockClueId);
    }).map((row) => ({ id: row.id, occurredAt: row.occurred_at_label, title: row.occurred_at_label, description: row.public_description ?? '' }));
  },

  async findClues(sessionId: string, episodeId: string): Promise<RecordClue[]> {
    const { data: states, error: stateError } = await serviceRoleClient.from('session_clues').select('clue_id, acquired_at').eq('session_id', sessionId);
    fail(stateError); if (!states?.length) return [];
    const { data, error } = await content.from('clues').select('id, code, title, content, clue_type, display_order').eq('episode_id', episodeId).in('id', states.map((row) => row.clue_id)).order('display_order');
    fail(error); const unlocked = new Map(states.map((row) => [row.clue_id,row.acquired_at]));
    return (data ?? []).map((row) => ({ id: row.id, code: row.code, title: row.title, description: row.content, clueType: row.clue_type, unlockedAt: unlocked.get(row.id)! }));
  },

  async findDialects(episodeId: string, revealMeaning: boolean): Promise<DialectRecord[]> {
    const { data, error } = await content.from('dialect_expressions').select('id, code, expression, standard_meaning, usage_context, display_order').eq('episode_id', episodeId).order('display_order');
    fail(error); return (data ?? []).map((row) => ({ id: row.id, code: row.code, dialectText: row.expression, usageContext: row.usage_context, ...(revealMeaning ? { standardMeaning: row.standard_meaning } : {}) }));
  },

  async findRelationships(episodeId: string, clueIds: string[]): Promise<RelationshipRecord[]> {
    const { data: episodeSuspects, error: suspectError } = await content.from('suspects').select('id, name').eq('episode_id', episodeId);
    fail(suspectError); const suspectMap = new Map((episodeSuspects ?? []).map((row) => [row.id,row.name])); if (!suspectMap.size) return [];
    const { data: relationships, error } = await content.from('suspect_relationships')
      .select('id, source_suspect_id, target_suspect_id, target_victim_id, relation_type, public_description')
      .eq('episode_id', episodeId).eq('disclosure_level', 'PUBLIC');
    const { data: victim, error: victimError } = await content.from('victims').select('id, name').eq('episode_id', episodeId).maybeSingle();
    fail(error); fail(victimError);
    return (relationships ?? []).filter((row) => suspectMap.has(row.source_suspect_id) && (!row.target_suspect_id || suspectMap.has(row.target_suspect_id)) && (!row.target_victim_id || row.target_victim_id === victim?.id)).map((row) => ({ id: row.id, suspect: { id: row.source_suspect_id, name: suspectMap.get(row.source_suspect_id)! }, relationshipType: row.relation_type, description: row.public_description ?? '', relatedSuspect: row.target_suspect_id ? { id: row.target_suspect_id, name: suspectMap.get(row.target_suspect_id)! } : null, victim: row.target_victim_id && victim ? { id: victim.id, name: victim.name } : null }));
  },

  async findNotes(sessionId: string, userId: string): Promise<NoteDto[]> {
    const { data, error } = await serviceRoleClient.from('session_notes').select('id, session_id, note_type, content, suspect_id, related_ref, created_at, updated_at').eq('session_id', sessionId).order('updated_at',{ascending:false});
    fail(error); return (data ?? []).map(noteDto);
  },

  async suspectBelongs(episodeId: string, suspectId: string): Promise<boolean> {
    const { data, error } = await content.from('suspects').select('id').eq('id',suspectId).eq('episode_id',episodeId).maybeSingle(); fail(error); return Boolean(data);
  },

  async createNote(sessionId: string, userId: string, input: NoteInput): Promise<NoteDto> {
    const { data, error } = await serviceRoleClient.from('session_notes').insert({ session_id:sessionId, note_type:dbNoteType(input.noteType), content:input.content, suspect_id:input.suspectId, related_ref:input.relatedRef }).select('id, session_id, note_type, content, suspect_id, related_ref, created_at, updated_at').single();
    fail(error);
    if (!data) throw toAppError({ code: 'DATABASE_ERROR', message: 'Inserted note row was not returned' });
    return noteDto(data);
  },

  async updateNote(sessionId: string, userId: string, noteId: string, patch: NotePatch): Promise<NoteDto | null> {
    const changes = { ...(patch.noteType !== undefined ? {note_type:dbNoteType(patch.noteType)}:{}), ...(patch.content !== undefined ? {content:patch.content}:{}), ...(patch.suspectId !== undefined ? {suspect_id:patch.suspectId}:{}), ...(patch.relatedRef !== undefined ? {related_ref:patch.relatedRef}:{}), updated_at:new Date().toISOString() };
    const { data, error } = await serviceRoleClient.from('session_notes').update(changes).eq('id',noteId).eq('session_id',sessionId).select('id, session_id, note_type, content, suspect_id, related_ref, created_at, updated_at').maybeSingle();
    fail(error); return data ? noteDto(data) : null;
  },

  async deleteNote(sessionId: string, userId: string, noteId: string): Promise<boolean> {
    const { data, error } = await serviceRoleClient.from('session_notes').delete().eq('id',noteId).eq('session_id',sessionId).select('id').maybeSingle(); fail(error); return Boolean(data);
  }
};
