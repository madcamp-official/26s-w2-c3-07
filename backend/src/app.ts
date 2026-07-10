import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { rateLimitMiddleware } from './middlewares/rate-limit.middleware.js';
import { routes } from './routes/index.js';

export const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(rateLimitMiddleware);
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', routes);
app.use(errorMiddleware);
