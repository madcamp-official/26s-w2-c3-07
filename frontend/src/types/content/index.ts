export type Region = { id: string; code: string; name: string; description: string | null; imageUrl: string | null; displayOrder: number; isActive: boolean };
export type EpisodeSummary = { id: string; code: string; title: string; location: string | null; incidentType: string | null; synopsis: string | null; estimatedPlayMinutes: number; status: string; imageUrl: string | null; progressStatus: string | null };
export type Difficulty = { difficulty: 'easy' | 'normal' | 'hard'; questionsPerSuspect: number; totalQuestions: number; timeLimitSeconds: number | null; dialectLevel: number; hintLimit: number };
export type VictimPublic = { name: string; age: number | null; occupation: string | null; profile: unknown };
export type EpisodeDetail = Omit<EpisodeSummary, 'progressStatus'> & { victim: VictimPublic; difficulties: Difficulty[] };
export type Scene = { narrative: string | null; victim: VictimPublic; timeline: { occurredAt: string; title: string; description: string }[]; evidence: { id: string; code: string; title: string; description: string; evidenceType: string }[] };
export type PublicSuspect = { id: string; code: string; name: string; age: number | null; occupation: string | null; publicProfile: { summary?: string }; victimRelation: string | null; displayOrder: number; imageUrl: string | null };
