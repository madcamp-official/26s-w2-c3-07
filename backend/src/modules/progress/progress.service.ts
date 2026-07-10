import { progressRepository } from './progress.repository.js';

export const progressService = {
  async listProgress() {
    return progressRepository.findAll();
  }
};
