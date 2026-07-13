import { episodeRepository } from './episode.repository.js';
import { AppError } from '../../shared/errors/app-error.js';

export const episodeService = {
  async listByRegion(regionId: string, userId?: string) { const episodes = await episodeRepository.findByRegion(regionId); if (!userId) return episodes; const progress = await episodeRepository.findProgress(userId, episodes.map((episode) => episode.id)); return episodes.map((episode) => ({ ...episode, progressStatus: progress.get(episode.id) ?? null })); },
  async detail(episodeId: string) { const episode = await episodeRepository.findById(episodeId); if (!episode) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); const [victim, difficulties] = await Promise.all([episodeRepository.findVictim(episodeId), episodeRepository.findDifficulties(episodeId)]); if (!victim) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); const { sceneDescription: _scene, progressStatus: _progress, ...publicEpisode } = episode; return { ...publicEpisode, victim, difficulties }; },
  async difficulties(episodeId: string) { if (!await episodeRepository.findById(episodeId)) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); return episodeRepository.findDifficulties(episodeId); },
  async scene(episodeId: string) { const episode = await episodeRepository.findById(episodeId); if (!episode) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); const [victim, parts] = await Promise.all([episodeRepository.findVictim(episodeId), episodeRepository.findSceneParts(episodeId)]); if (!victim) throw new AppError(404, 'Episode not found', 'EPISODE_NOT_FOUND'); return { narrative: episode.sceneDescription, victim, ...parts }; }
};
