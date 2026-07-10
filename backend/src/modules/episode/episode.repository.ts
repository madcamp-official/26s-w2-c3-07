import type { Episode } from './episode.types.js';

const episodes: Episode[] = [];

export const episodeRepository = {
  async findAll() {
    return episodes;
  }
};
