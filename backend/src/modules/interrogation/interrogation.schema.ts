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
  usedFactIds: z.array(z.string().uuid()).max(20).describe('Facts actually used and reflected in the final response.'),
  revealedFactIds: z.array(z.string().uuid()).max(20).describe('Previously undisclosed facts clearly newly revealed in this response.'),
  claimedFactIds: z.array(z.string().uuid()).max(20).describe('Facts asserted by the NPC as a claim or alibi, regardless of truth.'),
  characterConsistencyStatus: z.enum(['valid', 'invalid']),
  validationNotes: z.array(z.string().trim().min(1).max(200)).max(20)
}).strict();

const factKeySchema = z.string().regex(/^F[1-9]\d*$/);

export const compactInterrogationOutputSchema = z.object({
  response: z.string().trim().min(1).max(120),
  emotion: z.enum(EMOTIONS),
  evasion: z.enum(EVASION_TYPES).nullable(),
  usedFacts: z.array(factKeySchema).max(7).describe('Facts actually used and reflected in the final response.'),
  revealedFacts: z.array(factKeySchema).max(7).describe('Previously undisclosed facts clearly newly revealed in this response.'),
  claimedFacts: z.array(factKeySchema).max(7).describe('Facts asserted by the NPC as a claim or alibi, regardless of truth.')
}).strict();
