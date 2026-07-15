export type SessionStatus = 'READY' | 'INVESTIGATING' | 'INTERROGATING' | 'DEDUCTION' | 'COMPLETED' | 'ABANDONED' | 'EXPIRED';
export type SessionView = { sessionId: string; episodeId: string; episodeCode: string; difficulty: string; questionsPerSuspect: number; status: SessionStatus; startedAt: string; expiresAt: string; remainingSeconds: number; remainingQuestions: number; currentSuspectId: string | null; suspectStates: { suspectId: string; emotion: string; questionsAsked: number; questionsRemaining: number }[]; viewedEvidenceIds: string[]; acquiredClueCount: number };
export type SessionRoute = { sessionId: string; episodeId: string; episodeCode: string };
export type CreateSessionRequest = { episodeId: string; difficulty: 'easy' | 'normal' | 'hard' };
