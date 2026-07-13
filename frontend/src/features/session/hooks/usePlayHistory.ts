"use client";

import { useEffect, useState } from "react";
import { getCaseById } from "@/features/case/data";
import type { CaseData } from "@/features/case/types";
import { loadAllSessions } from "@/features/session/services/sessionStorage";
import type { GameSession } from "@/features/session/types";

export type PlayRecord = {
  session: GameSession;
  caseData: CaseData;
  isCleared: boolean;
  isCorrect: boolean;
  questionsUsed: number;
  cluesFound: number;
};

export function usePlayHistory() {
  const [records, setRecords] = useState<PlayRecord[]>([]);

  useEffect(() => {
    const sessions = loadAllSessions();
    const built = sessions
      .map((session) => {
        const caseData = getCaseById(session.caseId);
        if (!caseData) return null;
        return {
          session,
          caseData,
          isCleared: session.accusedId !== null,
          isCorrect: session.accusedId === caseData.culpritId,
          questionsUsed: session.conversations.reduce((acc, c) => acc + c.questionsUsed, 0),
          cluesFound: session.foundClueIds.length,
        };
      })
      .filter((r): r is PlayRecord => r !== null);
    setRecords(built);
  }, []);

  return records;
}
