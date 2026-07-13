import { anonClient, serviceRoleClient } from '../../config/supabase.js';
import { toAppError } from '../../shared/utils/supabase.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { SignInInput, UpdateProfileInput, UpdateSettingsInput } from './auth.schema.js';
import type { Profile, SignInResult, UserSettings } from './auth.types.js';

export const authRepository = {
  async signIn(input: SignInInput): Promise<SignInResult> {
    const { data, error } = await anonClient.auth.signInWithPassword(input);
    if (error || !data.session || !data.user) throw new AppError(401, 'Email or password is incorrect', 'AUTH_INVALID_CREDENTIALS');
    return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token, user: { id: data.user.id, email: data.user.email ?? null } };
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
    const changes = { ...(input.soundEnabled !== undefined && { sound_enabled: input.soundEnabled }), ...(input.musicEnabled !== undefined && { music_enabled: input.musicEnabled }), ...(input.textSpeed !== undefined && { text_speed: input.textSpeed }), updated_at: new Date().toISOString() };
    const { data, error } = await serviceRoleClient.from('user_settings').update(changes).eq('user_id', userId).select('user_id, sound_enabled, music_enabled, text_speed, locale').maybeSingle();
    if (error) throw toAppError(error, 'Failed to update settings');
    if (!data) throw new AppError(404, 'Settings not found', 'SETTINGS_NOT_FOUND');
    return { userId: data.user_id, soundEnabled: data.sound_enabled, musicEnabled: data.music_enabled, textSpeed: data.text_speed, locale: data.locale };
  }
};
