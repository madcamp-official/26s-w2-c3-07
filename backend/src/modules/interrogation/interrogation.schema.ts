import { z } from 'zod';
import { EMOTIONS, EVASION_TYPES } from './interrogation.types.js';

export const createInterrogationSchema = z.object({
  requestId: z.string().uuid(),
  suspectId: z.string().uuid(),
  question: z.string().trim().min(2).max(500),
  presentedEvidenceIds: z.array(z.string().uuid()).max(3).refine(
    (ids) => new Set(ids).size === ids.length,
    'presentedEvidenceIds must not contain duplicates'
  ).optional()
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
