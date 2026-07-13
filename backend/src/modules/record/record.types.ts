import type { Json } from '../../shared/types/database.types.js';

export type OwnedRecordSession = { id: string; user_id: string; episode_id: string; status: string };
export type CaseOverview = {
  id: string; code: string; title: string; location: string | null; incidentType: string | null;
  synopsis: string | null; status: string; victim: { name: string; age: number | null; occupation: string | null } | null;
};
export type RecordEvidence = { id: string; code: string; title: string; description: string; evidenceType: string; viewedAt: string };
export type Testimony = { id: string; suspectId: string; suspectName: string; question: string; response: string; questionType: string | null; emotion: string | null; createdAt: string };
export type TimelineEntry = { id: string; occurredAt: string; title: string; description: string };
export type RecordClue = { id: string; code: string; title: string; description: string; clueType: string; unlockedAt: string };
export type DialectRecord = { id: string; code: string; dialectText: string; usageContext: string | null; standardMeaning?: string };
export type RelationshipRecord = {
  id: string; suspect: { id: string; name: string }; relationshipType: string; description: string;
  relatedSuspect: { id: string; name: string } | null; victim: { id: string; name: string } | null;
};
export type NoteType = 'FREE' | 'CONTRADICTION' | 'DIALECT';
export type NoteInput = { noteType: NoteType; content: string; suspectId: string | null; relatedRef: Json };
export type NotePatch = Partial<NoteInput>;
export type NoteDto = NoteInput & { id: string; sessionId: string; createdAt: string; updatedAt: string };
export type InvestigationRecord = {
  caseOverview: CaseOverview; evidence: RecordEvidence[]; testimonies: Testimony[]; timeline: TimelineEntry[];
  clues: RecordClue[]; dialectExpressions: DialectRecord[]; relationships: RelationshipRecord[]; notes: NoteDto[];
};
