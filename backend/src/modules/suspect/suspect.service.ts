import { suspectRepository } from './suspect.repository.js';
import { episodeRepository } from '../episode/episode.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { SuspectRecord } from './suspect.types.js';

const publicDto = ({ episodeId: _episodeId, ...suspect }: SuspectRecord) => suspect;
export const suspectService = {
  async list(episodeKey: string) { const episode = await episodeRepository.findByKey(episodeKey); if (!episode) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); const suspects = await suspectRepository.findByEpisode(episode.id); return suspects.sort((a, b) => a.displayOrder - b.displayOrder).map(publicDto); },
  async detail(episodeKey: string, suspectKey: string) { const episode = await episodeRepository.findByKey(episodeKey); if (!episode) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); const suspect = await suspectRepository.findByKey(suspectKey, episode.id); if (!suspect) throw new AppError(404, 'Suspect not found', 'SUSPECT_NOT_FOUND'); return publicDto(suspect); }
};
