import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { authController } from './auth.controller.js';
import { signInSchema } from './auth.schema.js';

export const authRoute = Router();

authRoute.post('/sign-in', validateBody(signInSchema), authController.signIn);
