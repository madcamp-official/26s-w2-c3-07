import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(128)
});

export const signUpSchema = signInSchema.extend({
  displayName: z.string().trim().min(1).max(50)
}).strict();

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(50).nullable().optional(),
  avatarUrl: z.string().url().max(2048).nullable().optional()
}).refine((value) => Object.keys(value).length > 0, 'At least one profile field is required');

export const updateSettingsSchema = z.object({
  soundEnabled: z.boolean().optional(),
  musicEnabled: z.boolean().optional(),
  textSpeed: z.enum(['slow', 'normal', 'fast']).optional(),
  locale: z.enum(['ko', 'en']).optional()
}).refine((value) => Object.keys(value).length > 0, 'At least one settings field is required');

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
