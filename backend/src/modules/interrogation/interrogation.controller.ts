import type { NextFunction, Request, Response } from 'express';
import { interrogationService } from './interrogation.service.js';

const handle = (status: number, action: (request: Request) => Promise<unknown>) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      response.status(status).json({ success: true, data: await action(request) });
    } catch (error) {
      next(error);
    }
  };

export const interrogationController = {
  create: handle(201, (request) => interrogationService.ask(request.params.sessionId, request.user!.id, request.body)),
  list: handle(200, (request) => interrogationService.list(request.params.sessionId, request.user!.id)),
  listBySuspect: handle(200, (request) => interrogationService.list(request.params.sessionId, request.user!.id, request.params.suspectId))
};
