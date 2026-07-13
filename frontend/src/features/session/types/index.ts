import type { ConversationRecord, Difficulty } from "@/features/case/types";

export type GameSession = {
  sessionId: string;
  caseId: string;
  difficulty: Difficulty;
  conversations: ConversationRecord[];
  foundClueIds: string[];
  accusedId: string | null;
};
