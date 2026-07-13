export type EpisodeSummary = { id: string; code: string; title: string; location: string | null; incidentType: string | null; synopsis: string | null; estimatedPlayMinutes: number; status: string; imageUrl: string | null; progressStatus: string | null };
export type Difficulty = { difficulty: string; questionsPerSuspect: number; totalQuestions: number; timeLimitSeconds: number | null; dialectLevel: string; hintLimit: number };
export type VictimPublic = { name: string; age: number | null; occupation: string | null; profile: unknown };
export type EpisodeDetail = Omit<EpisodeSummary, 'progressStatus'> & { victim: VictimPublic; difficulties: Difficulty[] };
export type Scene = { narrative: string | null; victim: VictimPublic; timeline: { occurredAt: string; title: string; description: string }[]; evidence: { id: string; code: string; title: string; description: string; evidenceType: string }[] };
