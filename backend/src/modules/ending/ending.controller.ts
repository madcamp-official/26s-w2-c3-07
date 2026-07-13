import type { NextFunction, Request, Response } from 'express';
import { endingService } from './ending.service.js';

const handle = (action: (request: Request) => Promise<unknown>) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try { response.json({ success: true, data: await action(request) }); }
    catch (error) { next(error); }
  };

export const endingController = {
  ending: handle(request => endingService.ending(request.params.sessionId, request.user!.id)),
  report: handle(request => endingService.report(request.params.sessionId, request.user!.id))
};
