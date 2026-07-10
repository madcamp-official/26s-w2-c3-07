import type { Request, Response } from 'express';
import { episodeService } from './episode.service.js';

export const episodeController = {
  async list(_req: Request, res: Response) {
    res.json({ success: true, data: await episodeService.listEpisodes() });
  }
};
