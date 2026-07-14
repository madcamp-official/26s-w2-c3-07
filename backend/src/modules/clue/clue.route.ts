import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { clueController } from './clue.controller.js';

export const clueRoute = Router({ mergeParams: true });
clueRoute.use(requireAuth);
clueRoute.get('/clues', clueController.clues);
clueRoute.get('/evidence', clueController.evidence);
clueRoute.post('/evidence/:evidenceId/view', clueController.viewEvidence);
