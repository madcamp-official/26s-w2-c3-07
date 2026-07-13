export type Difficulty = "easy" | "normal" | "hard";

export type Emotion =
  | "calm"
  | "nervous"
  | "hostile"
  | "sad"
  | "deflect"
  | "angry"
  | "shocked"
  | "defensive";

export type Message = {
  id: number;
  role: "detective" | "suspect";
  text: string;
  emotion: Emotion;
  clueIds: string[];
};

export type Clue = {
  id: string;
  title: string;
  description: string;
  isKey: boolean;
};

export type Evidence = {
  id: string;
  title: string;
  description: string;
};

export type ResponseEntry = {
  trigger: string[];
  easy: string;
  normal: string;
  hard: string;
  emotion: Emotion;
  clueIds: string[];
};

export type Suspect = {
  id: string;
  name: string;
  age: number;
  job: string;
  relationship: string;
  isCulprit: boolean;
  portraitColor: string;
  metaResponse: string;
  accuseEasy: string;
  accuseNormal: string;
  accuseHard: string;
  defaultEasy: string;
  defaultNormal: string;
  defaultHard: string;
  responseBank: ResponseEntry[];
};

export type FalseEnding = {
  wrongLine: string;
  culpritMockLine: string;
};

export type CaseData = {
  id: string;
  regionId: string;
  regionName: string;
  regionEmoji: string;
  title: string;
  location: string;
  date: string;
  victim: { name: string; age: number; job: string };
  summary: string;
  evidence: Evidence[];
  clues: Clue[];
  suspects: Suspect[];
  culpritId: string;
  truth: string;
  trueEndingNarration: string;
  trueEndingArrestLine: string;
  falseEndings: Record<string, FalseEnding>;
  dialectGuide: { expression: string; meaning: string }[];
};

export type ConversationRecord = {
  suspectId: string;
  messages: Message[];
  questionsUsed: number;
};

export const QUESTIONS_PER_SUSPECT: Record<Difficulty, number> = {
  easy: 3,
  normal: 2,
  hard: 1,
};
