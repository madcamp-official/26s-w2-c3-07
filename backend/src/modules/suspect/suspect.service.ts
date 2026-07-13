import { suspectRepository } from './suspect.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { SuspectRecord } from './suspect.types.js';

const publicDto = ({ episodeId: _episodeId, ...suspect }: SuspectRecord) => suspect;
export const suspectService = {
  async list(episodeId: string) { if (!await suspectRepository.episodeExists(episodeId)) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); const suspects = await suspectRepository.findByEpisode(episodeId); return suspects.sort((a, b) => a.displayOrder - b.displayOrder).map(publicDto); },
  async detail(episodeId: string, suspectId: string) { if (!await suspectRepository.episodeExists(episodeId)) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); const suspect = await suspectRepository.findById(suspectId); if (!suspect) throw new AppError(404, 'Suspect not found', 'SUSPECT_NOT_FOUND'); if (suspect.episodeId !== episodeId) throw new AppError(404, 'Suspect does not belong to the episode', 'SUSPECT_NOT_IN_EPISODE'); return publicDto(suspect); }
};
