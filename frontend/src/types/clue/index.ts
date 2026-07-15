export type Clue = { id: string; code: string; title: string; description: string; content?: string; recordSummary?: string | null; importance?: string; clueType: string; unlockedAt: string; source: string | null };
export type Evidence = { id: string; code: string; title: string; description: string | null; evidenceType: string; discoveredAt: string | null; viewedAt: string | null; source: string | null };
export type EvidenceViewResult = { evidence: Evidence | null; newClues: Clue[]; newlyUnlockedEvidence: Evidence[] };
