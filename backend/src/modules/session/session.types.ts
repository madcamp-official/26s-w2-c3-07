export type DbSessionStatus =
  | 'CREATED'
  | 'INTRO_VIEWING'
  | 'INTERROGATING'
  | 'READY_TO_DEDUCE'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'ABANDONED'
  | 'ERROR';

export type SessionStatus = 'READY'|'INVESTIGATING'|'INTERROGATING'|'DEDUCTION'|'COMPLETED'|'ABANDONED'|'EXPIRED';
export type SessionView = { sessionId:string; episodeId:string; difficulty:string; questionsPerSuspect:number; status:SessionStatus; startedAt:string; expiresAt:string; remainingSeconds:number; remainingQuestions:number; currentSuspectId:string|null; suspectStates:{suspectId:string;emotion:string;questionsAsked:number;questionsRemaining:number}[]; viewedEvidenceIds:string[]; acquiredClueCount:number };
