import type { NextFunction, Request, Response } from 'express';
import { deductionService } from './deduction.service.js';

const handle = (status: number, action: (request: Request) => Promise<unknown>) =>
  async (request: Request, response: Response, next: NextFunction) => {
    try { response.status(status).json({ success: true, data: await action(request) }); }
    catch (error) { next(error); }
  };

export const deductionController = {
  submit: handle(201, request => deductionService.submit(request.params.sessionId, request.user!.id, request.body.suspectId)),
  result: handle(200, request => deductionService.result(request.params.sessionId, request.user!.id))
};
