import type { NextFunction, Request, Response } from 'express';
import { episodeService } from './episode.service.js';
const send = (handler: (req: Request) => unknown) => async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await handler(req) }); } catch (error) { next(error); } };
export const episodeController = {
  listByRegion: send((req) => episodeService.listByRegion(req.params.regionId, req.user?.id)),
  detail: send((req) => episodeService.detail(req.params.episodeId)),
  difficulties: send((req) => episodeService.difficulties(req.params.episodeId)),
  scene: send((req) => episodeService.scene(req.params.episodeId))
};
