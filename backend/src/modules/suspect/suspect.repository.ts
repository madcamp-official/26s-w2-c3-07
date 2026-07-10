import type { Suspect } from './suspect.types.js';

const suspects: Suspect[] = [];

export const suspectRepository = {
  async findAll() {
    return suspects;
  }
};
