export type ClueDto = {
  id: string;
  code: string;
  title: string;
  content: string;
  description: string;
  recordSummary: string | null;
  clueType: string;
  importance: string;
  unlockedAt: string;
  source: string | null;
};

export type EvidenceDto = {
  id: string;
  code: string;
  title: string;
  description: string;
  evidenceType: string;
  discoveredAt: string | null;
  viewedAt: string | null;
};

export type ClueEvaluationSource = 'EVIDENCE_VIEWED' | 'INTERROGATION' | 'SESSION_REFRESH';
export type EvidenceViewRpcResult = { evidenceId: string; viewedAt: string; newClueIds: string[]; newEvidenceIds: string[] };
export type OwnedClueSession = { id: string; user_id: string; episode_id: string };
