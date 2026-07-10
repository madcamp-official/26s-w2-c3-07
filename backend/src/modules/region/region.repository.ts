import type { Region } from './region.types.js';

const regions: Region[] = [];

export const regionRepository = {
  async findAll() {
    return regions;
  }
};
