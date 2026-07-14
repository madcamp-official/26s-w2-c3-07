import type { NextFunction, Request, Response } from 'express';
import { progressService } from './progress.service.js';

const handle = (action: (request: Request) => Promise<unknown>) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try { response.json({ success: true, data: await action(request) }); }
    catch (error) { next(error); }
  };

export const progressController = {
  summary: handle(request => progressService.summary(request.user!.id)),
  episodes: handle(request => progressService.episodes(request.user!.id)),
  history: handle(request => progressService.history(request.user!.id, request.query)),
  dialects: handle(request => progressService.dialects(request.user!.id))
};
