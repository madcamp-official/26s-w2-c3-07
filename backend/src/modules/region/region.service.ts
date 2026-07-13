import { regionRepository } from './region.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { Region } from './region.types.js';

type RegionReader = { findAll(): Promise<Region[]>; findByIdOrCode(identifier: string): Promise<Region | null> };

export const createRegionService = (repository: RegionReader) => ({
  async listRegions() {
    const regions = await repository.findAll();
    return regions.filter((region) => region.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
  },
  async getRegion(identifier: string) {
    const region = await repository.findByIdOrCode(identifier);
    if (!region?.isActive) throw new AppError(404, 'Region not found', 'REGION_NOT_FOUND');
    return region;
  }
});

export const regionService = createRegionService(regionRepository);
