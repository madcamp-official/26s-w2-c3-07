import { z } from 'zod';
import { EMOTIONS, EVASION_TYPES } from './interrogation.types.js';

export const createInterrogationSchema = z.object({
  requestId: z.string().uuid(),
  suspectId: z.string().uuid(),
  question: z.string().trim().min(2).max(500)
}).strict();

export const structuredInterrogationSchema = z.object({
  dialectResponse: z.string().trim().min(1).max(500),
  emotion: z.enum(EMOTIONS),
  usedFactIds: z.array(z.string().uuid()).max(20),
  evasionType: z.enum(EVASION_TYPES),
  consistencyStatus: z.enum(['VALID', 'INVALID'])
}).strict();
