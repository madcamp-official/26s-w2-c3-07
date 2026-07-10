import type { Ending } from './ending.types.js';

const endings: Ending[] = [];

export const endingRepository = {
  async create(ending: Ending) {
    endings.push(ending);
    return ending;
  },
  async findAll() {
    return endings;
  }
};
