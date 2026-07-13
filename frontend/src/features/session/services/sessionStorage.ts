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

export function loadAllSessions(): GameSession[] {
  if (typeof window === "undefined") return [];
  const sessions: GameSession[] = [];
  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i);
    if (!key?.startsWith("game-session:")) continue;
    try {
      const raw = window.sessionStorage.getItem(key);
      if (raw) sessions.push(JSON.parse(raw) as GameSession);
    } catch {
      // 손상된 항목은 건너뜀
    }
  }
  return sessions;
}
