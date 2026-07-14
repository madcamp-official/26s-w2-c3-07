export type Clue = { id: string; code: string; title: string; description: string; content?: string; recordSummary?: string | null; importance?: string; clueType: string; unlockedAt: string; source: string | null };
export type Evidence = { id: string; code: string; title: string; description: string; evidenceType: string; discoveredAt: string; viewedAt: string | null };
export type EvidenceViewResult = { evidenceId: string; viewedAt: string; newClueIds: string[]; newlyUnlockedEvidence: Evidence[] };
