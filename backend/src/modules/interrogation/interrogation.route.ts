import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { interrogationController } from './interrogation.controller.js';
import { createInterrogationSchema } from './interrogation.schema.js';

export const interrogationRoute = Router();

interrogationRoute.get('/', interrogationController.list);
interrogationRoute.post('/', validateBody(createInterrogationSchema), interrogationController.create);
