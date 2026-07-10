import { interrogationRepository } from './interrogation.repository.js';

export const interrogationService = {
  async askQuestion(sessionId: string, suspectId: string, question: string) {
    return interrogationRepository.create({ sessionId, suspectId, question });
  },
  async listInterrogations() {
    return interrogationRepository.findAll();
  }
};
