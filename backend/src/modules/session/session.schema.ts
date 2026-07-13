import { z } from 'zod';
export const createSessionSchema = z.object({ episodeId: z.string().uuid(), difficulty: z.enum(['easy','normal','hard']) });
export const selectSuspectSchema = z.object({ suspectId: z.string().uuid() });
