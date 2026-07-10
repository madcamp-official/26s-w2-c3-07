import { Router } from 'express';
import { authRoute } from '../modules/auth/auth.route.js';
import { clueRoute } from '../modules/clue/clue.route.js';
import { deductionRoute } from '../modules/deduction/deduction.route.js';
import { endingRoute } from '../modules/ending/ending.route.js';
import { episodeRoute } from '../modules/episode/episode.route.js';
import { interrogationRoute } from '../modules/interrogation/interrogation.route.js';
import { progressRoute } from '../modules/progress/progress.route.js';
import { recordRoute } from '../modules/record/record.route.js';
import { regionRoute } from '../modules/region/region.route.js';
import { sessionRoute } from '../modules/session/session.route.js';
import { suspectRoute } from '../modules/suspect/suspect.route.js';

export const routes = Router();

routes.use('/auth', authRoute);
routes.use('/regions', regionRoute);
routes.use('/episodes', episodeRoute);
routes.use('/suspects', suspectRoute);
routes.use('/sessions', sessionRoute);
routes.use('/interrogations', interrogationRoute);
routes.use('/clues', clueRoute);
routes.use('/records', recordRoute);
routes.use('/deductions', deductionRoute);
routes.use('/endings', endingRoute);
routes.use('/progress', progressRoute);
