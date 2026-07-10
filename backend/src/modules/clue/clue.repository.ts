import type { Clue } from './clue.types.js';

const clues: Clue[] = [];

export const clueRepository = {
  async findAll() {
    return clues;
  }
};
