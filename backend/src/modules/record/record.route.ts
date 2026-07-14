import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { recordController } from './record.controller.js';
import { createNoteSchema, updateNoteSchema } from './record.schema.js';

export const recordRoute = Router({ mergeParams:true });
recordRoute.use(requireAuth);
recordRoute.get('/records',recordController.records);
recordRoute.get('/records/testimonies',recordController.testimonies);
recordRoute.get('/records/timeline',recordController.timeline);
recordRoute.get('/records/relationships',recordController.relationships);
recordRoute.post('/notes',validateBody(createNoteSchema),recordController.createNote);
recordRoute.patch('/notes/:noteId',validateBody(updateNoteSchema),recordController.updateNote);
recordRoute.delete('/notes/:noteId',recordController.deleteNote);
