import type { GameSession } from './session.types.js';

const sessions: GameSession[] = [];

export const sessionRepository = {
  async create(userId: string, episodeId: string): Promise<GameSession> {
    const session = { id: crypto.randomUUID(), userId, episodeId, status: 'active' as const };
    sessions.push(session);
    return session;
  },
  async findAll() {
    return sessions;
  }
};
