import { sessionRepository } from './session.repository.js';

export const sessionService = {
  async createSession(userId: string, episodeId: string) {
    return sessionRepository.create(userId, episodeId);
  },
  async listSessions() {
    return sessionRepository.findAll();
  }
};
