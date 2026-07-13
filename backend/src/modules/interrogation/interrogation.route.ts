import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { interrogationController } from './interrogation.controller.js';
import { createInterrogationSchema } from './interrogation.schema.js';

export const interrogationRoute = Router({ mergeParams: true });
interrogationRoute.use(requireAuth);
interrogationRoute.get('/', interrogationController.list);
interrogationRoute.post('/', validateBody(createInterrogationSchema), interrogationController.create);

export const suspectInterrogationRoute = Router({ mergeParams: true });
suspectInterrogationRoute.use(requireAuth);
suspectInterrogationRoute.get('/', interrogationController.listBySuspect);
