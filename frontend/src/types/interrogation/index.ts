import type { Clue } from '@/types/clue';

export type UnlockedEvidence = {
  id: string;
  code: string;
  title: string;
  description: string;
  evidenceType: string;
};

export type InterrogationMessage = {
  id: string;
  sessionId: string;
  suspectId: string;
  requestId: string;
  question: string;
  questionType: string;
  dialectResponse: string;
  emotionAfter: string;
  evasionType: string | null;
  usedFactIds: string[];
  revealedFactIds: string[];
  claimedFactIds: string[];
  presentedEvidenceIds: string[];
  characterConsistencyStatus: 'valid' | 'invalid';
  validationNotes: string[];
  createdAt: string;
};

export type InterrogationResponse = {
  message: {
    id: string;
    npcResponse: string;
    emotionAfter: string;
    evasionType: string | null;
  };
  newlyUnlockedClues: Array<Pick<Clue, 'id' | 'code' | 'title' | 'content' | 'recordSummary' | 'clueType' | 'importance'>>;
  newlyUnlockedEvidence: UnlockedEvidence[];
  remainingQuestions: number;
};
