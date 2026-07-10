import { z } from 'zod';

export const submitDeductionSchema = z.object({
  sessionId: z.string().min(1),
  suspectId: z.string().min(1),
  motive: z.string().min(1)
});
