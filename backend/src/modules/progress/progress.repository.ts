import type { Progress } from './progress.types.js';

const progressList: Progress[] = [];

export const progressRepository = {
  async findAll() {
    return progressList;
  }
};
