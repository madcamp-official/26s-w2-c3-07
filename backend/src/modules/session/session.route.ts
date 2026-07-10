import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { sessionController } from './session.controller.js';
import { createSessionSchema } from './session.schema.js';

export const sessionRoute = Router();

sessionRoute.get('/', sessionController.list);
sessionRoute.post('/', validateBody(createSessionSchema), sessionController.create);
