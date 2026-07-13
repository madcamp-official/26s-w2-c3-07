export type ClueDto = {
  id: string;
  code: string;
  title: string;
  description: string;
  clueType: string;
  unlockedAt: string;
  source: string | null;
};

export type EvidenceDto = {
  id: string;
  code: string;
  title: string;
  description: string;
  evidenceType: string;
  discoveredAt: string;
  viewedAt: string | null;
};

export type ClueEvaluationSource = 'EVIDENCE_VIEWED' | 'INTERROGATION' | 'SESSION_REFRESH';
export type EvidenceViewRpcResult = { evidenceId: string; viewedAt: string; newClueIds: string[] };
export type OwnedClueSession = { id: string; user_id: string; episode_id: string };
