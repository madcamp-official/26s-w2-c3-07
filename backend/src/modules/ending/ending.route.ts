import { Router } from 'express';
import { endingController } from './ending.controller.js';

export const endingRoute = Router();

endingRoute.get('/', endingController.list);
endingRoute.post('/', endingController.create);
