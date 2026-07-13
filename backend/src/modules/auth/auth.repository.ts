import { anonClient, serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { SignInInput, SignUpInput, UpdateProfileInput, UpdateSettingsInput } from './auth.schema.js';
import type { Profile, SignInResult, SignUpResult, UserSettings } from './auth.types.js';

const duplicateEmail = (message: string) => /already|registered|exists|duplicate/i.test(message);

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
      email_confirm: true
    });
    if (createError || !created.user) {
      if (createError && duplicateEmail(createError.message)) throw new AppError(409, 'Email is already registered', 'AUTH_EMAIL_ALREADY_EXISTS');
      throw new AppError(500, 'Failed to create user', 'AUTH_SIGN_UP_FAILED');
    }
    const userId = created.user.id;
    try {
      const [{ data: profileRow, error: profileError }, { data: settingsRow, error: settingsError }] = await Promise.all([
        serviceRoleClient.from('profiles').insert({ user_id: userId, display_name: input.displayName }).select('user_id, display_name, avatar_url').single(),
        serviceRoleClient.from('user_settings').insert({ user_id: userId }).select('user_id, sound_enabled, music_enabled, text_speed, locale').single()
      ]);
      if (profileError) throw toAppError(profileError, 'Failed to create profile');
      if (settingsError) throw toAppError(settingsError, 'Failed to create settings');
      const session = await this.signIn({ email: input.email, password: input.password });
      return {
        ...session,
        profile: { userId: profileRow.user_id, displayName: profileRow.display_name, avatarUrl: profileRow.avatar_url },
        settings: { userId: settingsRow.user_id, soundEnabled: settingsRow.sound_enabled, musicEnabled: settingsRow.music_enabled, textSpeed: settingsRow.text_speed, locale: settingsRow.locale }
      };
    } catch (error) {
      await serviceRoleClient.auth.admin.deleteUser(userId).catch(() => undefined);
      throw error;
    }
  },
  async getProfile(userId: string): Promise<Profile> {
    const { data, error } = await serviceRoleClient.from('profiles').select('user_id, display_name, avatar_url').eq('user_id', userId).maybeSingle();
    if (error) throw toAppError(error, 'Failed to load profile');
    if (!data) throw new AppError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
    return { userId: data.user_id, displayName: data.display_name, avatarUrl: data.avatar_url };
  },
  async updateProfile(userId: string, input: UpdateProfileInput): Promise<Profile> {
    const changes = { ...(input.displayName !== undefined && { display_name: input.displayName }), ...(input.avatarUrl !== undefined && { avatar_url: input.avatarUrl }), updated_at: new Date().toISOString() };
    const { data, error } = await serviceRoleClient.from('profiles').update(changes).eq('user_id', userId).select('user_id, display_name, avatar_url').maybeSingle();
    if (error) throw toAppError(error, 'Failed to update profile');
    if (!data) throw new AppError(404, 'Profile not found', 'PROFILE_NOT_FOUND');
    return { userId: data.user_id, displayName: data.display_name, avatarUrl: data.avatar_url };
  },
  async getSettings(userId: string): Promise<UserSettings> {
    const { data, error } = await serviceRoleClient.from('user_settings').select('user_id, sound_enabled, music_enabled, text_speed, locale').eq('user_id', userId).maybeSingle();
    if (error) throw toAppError(error, 'Failed to load settings');
    if (!data) throw new AppError(404, 'Settings not found', 'SETTINGS_NOT_FOUND');
    return { userId: data.user_id, soundEnabled: data.sound_enabled, musicEnabled: data.music_enabled, textSpeed: data.text_speed, locale: data.locale };
  },
  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<UserSettings> {
    const changes = { ...(input.soundEnabled !== undefined && { sound_enabled: input.soundEnabled }), ...(input.musicEnabled !== undefined && { music_enabled: input.musicEnabled }), ...(input.textSpeed !== undefined && { text_speed: input.textSpeed }), ...(input.locale !== undefined && { locale: input.locale }), updated_at: new Date().toISOString() };
    const { data, error } = await serviceRoleClient.from('user_settings').update(changes).eq('user_id', userId).select('user_id, sound_enabled, music_enabled, text_speed, locale').maybeSingle();
    if (error) throw toAppError(error, 'Failed to update settings');
    if (!data) throw new AppError(404, 'Settings not found', 'SETTINGS_NOT_FOUND');
    return { userId: data.user_id, soundEnabled: data.sound_enabled, musicEnabled: data.music_enabled, textSpeed: data.text_speed, locale: data.locale };
  }
};
