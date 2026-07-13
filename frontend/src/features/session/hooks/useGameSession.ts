"use client";

import { useCallback, useEffect, useState } from "react";
import type { Difficulty, Message } from "@/features/case/types";
import { createSession, saveSession } from "@/features/session/services/sessionStorage";
import type { GameSession } from "@/features/session/types";

export function useGameSession(sessionId: string, caseId: string, difficulty: Difficulty) {
  const [session, setSession] = useState<GameSession | null>(null);

  useEffect(() => {
    setSession(createSession(sessionId, caseId, difficulty));
  }, [sessionId, caseId, difficulty]);

  const addExchange = useCallback(
    (suspectId: string, detectiveMsg: Message, suspectMsg: Message) => {
      setSession((prev) => {
        if (!prev) return prev;
        const conversations = [...prev.conversations];
        const idx = conversations.findIndex((c) => c.suspectId === suspectId);
        if (idx === -1) {
          conversations.push({ suspectId, messages: [detectiveMsg, suspectMsg], questionsUsed: 1 });
        } else {
          conversations[idx] = {
            ...conversations[idx],
            messages: [...conversations[idx].messages, detectiveMsg, suspectMsg],
            questionsUsed: conversations[idx].questionsUsed + 1,
          };
        }
        const foundClueIds = Array.from(new Set([...prev.foundClueIds, ...suspectMsg.clueIds]));
        const next = { ...prev, conversations, foundClueIds };
        saveSession(next);
        return next;
      });
    },
    [],
  );

  const setAccusedId = useCallback((accusedId: string) => {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, accusedId };
      saveSession(next);
      return next;
    });
  }, []);

  return { session, addExchange, setAccusedId };
}
