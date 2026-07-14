import { anonClient, serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { SignInInput, SignUpInput, UpdateProfileInput, UpdateSettingsInput } from './auth.schema.js';
import type { Profile, SignInResult, SignUpResult, UserSettings } from './auth.types.js';

const duplicateEmail = (message: string) => /already|registered|exists|duplicate/i.test(message);
const textSpeedToDatabase = { slow: 1, normal: 2, fast: 3 } as const;
const textSpeedFromDatabase = (value: number): UserSettings['textSpeed'] => value === 1 ? 'slow' : value === 3 ? 'fast' : 'normal';
const toSettings = (row: { user_id: string; sfx_enabled: boolean; bgm_enabled: boolean; text_speed: number; locale: string }): UserSettings => ({
  userId: row.user_id,
  soundEnabled: row.sfx_enabled,
  musicEnabled: row.bgm_enabled,
  textSpeed: textSpeedFromDatabase(row.text_speed),
  locale: row.locale === 'en' ? 'en' : 'ko'
});

export const authRepository = {
  async signIn(input: SignInInput): Promise<SignInResult> {
    const { data, error } = await anonClient.auth.signInWithPassword(input);
    if (error || !data.session || !data.user) throw new AppError(401, 'Email or password is incorrect', 'AUTH_INVALID_CREDENTIALS');
    return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token, user: { id: data.user.id, email: data.user.email ?? null } };
  },
  async signUp(input: SignUpInput): Promise<SignUpResult> {
    const { data: created, error: createError } = await serviceRoleClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { display_name: input.displayName }
    });
    if (createError || !created.user) {
      if (createError && duplicateEmail(createError.message)) throw new AppError(409, 'Email is already registered', 'AUTH_EMAIL_ALREADY_EXISTS');
      throw new AppError(500, 'Failed to create user', 'AUTH_SIGN_UP_FAILED');
    }
    const userId = created.user.id;
    try {
      const [{ data: profileRow, error: profileError }, { data: settingsRow, error: settingsError }] = await Promise.all([
        serviceRoleClient.from('profiles').update({ display_name: input.displayName }).eq('id', userId).select('id, display_name, avatar_url').single(),
        serviceRoleClient.from('user_settings').select('user_id, sfx_enabled, bgm_enabled, text_speed, locale').eq('user_id', userId).single()
      ]);
      if (profileError) throw toAppError(profileError, 'Failed to create profile');
      if (settingsError) throw toAppError(settingsError, 'Failed to create settings');
      const session = await this.signIn({ email: input.email, password: input.password });
      return {
        ...session,
        profile: { userId: profileRow.id, displayName: profileRow.display_name, avatarUrl: profileRow.avatar_url },
        settings: toSettings(settingsRow)
      };
    } catch (error) {
      await serviceRoleClient.auth.admin.deleteUser(userId).catch(() => undefined);
      throw error;
    }
  },
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await serviceRoleClient.from('profiles').select('id, display_name, avatar_url').eq('id', userId).maybeSingle();
    if (error) throw toAppError(error, 'Failed to load profile');
    if (!data) throw new AppError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
    return { userId: data.id, displayName: data.display_name, avatarUrl: data.avatar_url };
  },
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const changes = { ...(input.displayName !== undefined && { display_name: input.displayName }), ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }), updated_at: new Date().toISOString() };
    const { data, error } = await serviceRoleClient.from('profiles').update(changes).eq('id', userId).select('id, display_name, avatar_url').maybeSingle();
    if (error) throw toAppError(error, 'Failed to update profile');
    if (!data) throw new AppError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
    return { userId: data.id, displayName: data.display_name, avatarUrl: data.avatar_url };
  },
  async getSettings(userId: string): Promise<UserSettings> {
    const { data, error } = await serviceRoleClient.from('user_settings').select('user_id, sfx_enabled, bgm_enabled, text_speed, locale').eq('user_id', userId).maybeSingle();
    if (error) throw toAppError(error, 'Failed to load settings');
    if (!data) throw new AppError(404, 'Settings not found', 'SETTINGS_NOT_FOUND');
    return toSettings(data);
  },
  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<UserSettings> {
    const changes = { ...(input.soundEnabled !== undefined && { sfx_enabled: input.soundEnabled }), ...(input.musicEnabled !== undefined && { bgm_enabled: input.musicEnabled }), ...(input.textSpeed !== undefined && { text_speed: textSpeedToDatabase[input.textSpeed] }), ...(input.locale !== undefined && { locale: input.locale }), updated_at: new Date().toISOString() };
    const { data, error } = await serviceRoleClient.from('user_settings').update(changes).eq('user_id', userId).select('user_id, sfx_enabled, bgm_enabled, text_speed, locale').maybeSingle();
    if (error) throw toAppError(error, 'Failed to update settings');
    if (!data) throw new AppError(404, 'Settings not found', 'SETTINGS_NOT_FOUND');
    return toSettings(data);
  }
};
