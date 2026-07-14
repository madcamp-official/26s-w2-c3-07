import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { deductionController } from './deduction.controller.js';
import { submitDeductionSchema } from './deduction.schema.js';

export const deductionRoute = Router({ mergeParams: true });

deductionRoute.use(requireAuth);
deductionRoute.post('/deduction', validateBody(submitDeductionSchema), deductionController.submit);
deductionRoute.get('/result', deductionController.result);
