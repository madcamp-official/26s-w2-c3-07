import type { Clue } from '@/types/clue';

export type InterrogationMessage = {
  id: string; sessionId: string; suspectId: string; requestId: string; question: string;
  questionType: string; questionTypeLabel: string; dialectResponse: string;
  emotionAfter: string; emotionAfterLabel: string; emotionBeforeLabel: string | null;
  evasionType: string | null; usedFactIds: string[]; revealedFactIds: string[];
  claimedFactIds: string[]; presentedEvidenceIds: string[];
  characterConsistencyStatus: 'valid' | 'invalid'; validationNotes: string[]; createdAt: string;
};

export type InterrogationResponse = {
  message: { id: string; npcResponse: string; emotionAfter: string; emotionAfterLabel: string; evasionType: string | null };
  newlyUnlockedClues: Array<Pick<Clue, 'id' | 'code' | 'title' | 'content' | 'recordSummary' | 'clueType' | 'importance'>>;
  newlyUnlockedEvidence: Array<{ id: string; code: string; title: string; description: string; evidenceType: string }>;
  remainingQuestions: number;
};
