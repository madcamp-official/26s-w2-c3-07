import { clueRepository } from './clue.repository.js';

export const clueService = {
  async listClues() {
    return clueRepository.findAll();
  }
};
