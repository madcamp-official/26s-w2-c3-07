import type { NextFunction, Request, Response } from 'express';
import { recordService } from './record.service.js';

const handle = (status: number, action: (request: Request) => Promise<unknown>) => async (request: Request, response: Response, next: NextFunction) => {
  try { response.status(status).json({ success:true, data:await action(request) }); } catch (error) { next(error); }
};
const userId = (request: Request) => request.user!.id;

export const recordController = {
  records: handle(200, request => recordService.records(request.params.sessionId,userId(request))),
  testimonies: handle(200, request => recordService.testimonies(request.params.sessionId,userId(request))),
  timeline: handle(200, request => recordService.timeline(request.params.sessionId,userId(request))),
  relationships: handle(200, request => recordService.relationships(request.params.sessionId,userId(request))),
  createNote: handle(201, request => recordService.createNote(request.params.sessionId,userId(request),request.body)),
  updateNote: handle(200, request => recordService.updateNote(request.params.sessionId,userId(request),request.params.noteId,request.body)),
  deleteNote: handle(200, request => recordService.deleteNote(request.params.sessionId,userId(request),request.params.noteId))
};
