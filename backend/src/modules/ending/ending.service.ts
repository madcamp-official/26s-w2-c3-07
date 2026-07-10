import { endingGrade } from '../../game/ending.rule.js';
import { endingRepository } from './ending.repository.js';

export const endingService = {
  async createEnding(sessionId: string, score: number) {
    return endingRepository.create({
      sessionId,
      grade: endingGrade(score),
      summary: 'Ending summary is ready to be generated.'
    });
  },
  async listEndings() {
    return endingRepository.findAll();
  }
};
