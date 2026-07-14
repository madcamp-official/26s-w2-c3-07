import type { NextFunction, Request, Response } from 'express';
import { suspectService } from './suspect.service.js';
const send = (handler: (req: Request) => unknown) => async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await handler(req) }); } catch (error) { next(error); } };
export const suspectController = { list: send((req) => suspectService.list(req.params.episodeKey)), detail: send((req) => suspectService.detail(req.params.episodeKey, req.params.suspectId)) };
