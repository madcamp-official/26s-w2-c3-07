import { Router } from 'express';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { deductionController } from './deduction.controller.js';
import { submitDeductionSchema } from './deduction.schema.js';

export const deductionRoute = Router();

deductionRoute.get('/', deductionController.list);
deductionRoute.post('/', validateBody(submitDeductionSchema), deductionController.create);
