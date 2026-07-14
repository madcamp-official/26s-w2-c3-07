import OpenAI from 'openai';
import { env } from './env.js';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || 'missing-key',
  timeout: env.OPENAI_TIMEOUT_MS,
  maxRetries: 0,
});
