import type { NextFunction, Request, Response } from 'express';
import { clueService } from './clue.service.js';

const handle = (action: (request: Request) => Promise<unknown>) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try {
      response.json({ success: true, data: await action(request) });
    } catch (error) {
      next(error);
    }
  };

export const clueController = {
  clues: handle((request) => clueService.listClues(request.params.sessionId, request.user!.id)),
  evidence: handle((request) => clueService.listEvidence(request.params.sessionId, request.user!.id)),
  viewEvidence: handle((request) => clueService.viewEvidence(request.params.sessionId, request.user!.id, request.params.evidenceId))
};
