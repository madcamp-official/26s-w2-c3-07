import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { authController } from './auth.controller.js';
import { signInSchema } from './auth.schema.js';
import { updateProfileSchema, updateSettingsSchema } from './auth.schema.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

export const authRoute = Router();

authRoute.post('/sign-in', validateBody(signInSchema), authController.signIn);
authRoute.get('/me', requireAuth, authController.me);
authRoute.patch('/me', requireAuth, validateBody(updateProfileSchema), authController.updateMe);
authRoute.get('/settings', requireAuth, authController.settings);
authRoute.patch('/settings', requireAuth, validateBody(updateSettingsSchema), authController.updateSettings);
