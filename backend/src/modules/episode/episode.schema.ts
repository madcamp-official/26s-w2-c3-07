import { z } from 'zod';

export const episodeIdSchema = z.object({
  episodeId: z.string().min(1)
});
