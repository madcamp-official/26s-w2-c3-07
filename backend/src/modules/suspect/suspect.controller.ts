import type { NextFunction, Request, Response } from 'express';
import { suspectService } from './suspect.service.js';
const send = (handler: (req: Request) => unknown) => async (req: Request, res: Response, next: NextFunction) => { try { res.json({ success: true, data: await handler(req) }); } catch (error) { next(error); } };
export const suspectController = { list: send((req) => suspectService.list(req.params.episodeId)), detail: send((req) => suspectService.detail(req.params.episodeId, req.params.suspectId)) };
