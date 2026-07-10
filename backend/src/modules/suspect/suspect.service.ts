import { suspectRepository } from './suspect.repository.js';

export const suspectService = {
  async listSuspects() {
    return suspectRepository.findAll();
  }
};
