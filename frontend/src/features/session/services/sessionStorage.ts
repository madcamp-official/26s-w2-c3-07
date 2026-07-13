import type { Difficulty } from "@/features/case/types";
import type { GameSession } from "@/features/session/types";

function storageKey(sessionId: string) {
  return `game-session:${sessionId}`;
}

export function loadSession(sessionId: string): GameSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(storageKey(sessionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameSession;
  } catch {
    return null;
  }
}

export function saveSession(session: GameSession) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(storageKey(session.sessionId), JSON.stringify(session));
}

export function createSession(sessionId: string, caseId: string, difficulty: Difficulty): GameSession {
  const existing = loadSession(sessionId);
  if (existing && existing.caseId === caseId) return existing;

  const session: GameSession = {
    sessionId,
    caseId,
    difficulty,
    conversations: [],
    foundClueIds: [],
    accusedId: null,
  };
  saveSession(session);
  return session;
}
