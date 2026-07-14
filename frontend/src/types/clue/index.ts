export type Clue = { id: string; code: string; title: string; content: string; description: string; recordSummary: string | null; clueType: string; importance: string; unlockedAt: string; source: string | null };
export type Evidence = { id: string; code: string; title: string; description: string; evidenceType: string; discoveredAt: string | null; viewedAt: string | null };
export type EvidenceViewResult = { evidence: Evidence; newClues: Clue[]; newlyUnlockedEvidence: Evidence[] };
