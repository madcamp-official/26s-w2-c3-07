import { Router } from 'express';
import { recordController } from './record.controller.js';

export const recordRoute = Router();

recordRoute.get('/', recordController.list);
