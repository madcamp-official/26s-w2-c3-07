import { z } from 'zod';
import { EMOTIONS, EVASION_TYPES } from './interrogation.types.js';

export const createInterrogationSchema = z.object({
  requestId: z.string().uuid(),
  suspectId: z.string().uuid(),
  question: z.string().trim().min(2).max(500),
  presentedEvidenceIds: z.array(z.string().uuid()).max(3)
    .transform((ids) => [...new Set(ids)]).optional()
}).strict();

export const structuredInterrogationSchema = z.object({
  dialectResponse: z.string().trim().min(1).max(500),
  emotionAfter: z.enum(EMOTIONS),
  evasionType: z.enum(EVASION_TYPES).nullable(),
  usedFactIds: z.array(z.string().uuid()).max(20),
  revealedFactIds: z.array(z.string().uuid()).max(20),
  claimedFactIds: z.array(z.string().uuid()).max(20),
  characterConsistencyStatus: z.enum(['valid', 'invalid']),
  validationNotes: z.array(z.string().trim().min(1).max(200)).max(20)
}).strict();

const factKeySchema = z.string().regex(/^F[1-9]\d*$/);

export const compactInterrogationOutputSchema = z.object({
  response: z.string().trim().min(1).max(120),
  emotion: z.enum(EMOTIONS),
  evasion: z.enum(EVASION_TYPES).nullable(),
  usedFacts: z.array(factKeySchema).max(7),
  revealedFacts: z.array(factKeySchema).max(7),
  claimedFacts: z.array(factKeySchema).max(7)
}).strict();
