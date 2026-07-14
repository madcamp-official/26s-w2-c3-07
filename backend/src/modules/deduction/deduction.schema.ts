import { z } from 'zod';

export const submitDeductionSchema = z.object({
  suspectId: z.string().uuid()
}).strict();
