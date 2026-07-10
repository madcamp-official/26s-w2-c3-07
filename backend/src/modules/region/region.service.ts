import { regionRepository } from './region.repository.js';

export const regionService = {
  async listRegions() {
    return regionRepository.findAll();
  }
};
