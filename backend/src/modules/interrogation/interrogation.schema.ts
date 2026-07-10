import { z } from 'zod';

export const createInterrogationSchema = z.object({
  sessionId: z.string().min(1),
  suspectId: z.string().min(1),
  question: z.string().min(1)
});
