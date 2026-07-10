import { episodeRepository } from './episode.repository.js';

export const episodeService = {
  async listEpisodes() {
    return episodeRepository.findAll();
  }
};
