export type AuthUser = {
  id: string;
  email: string | null;
};

export type Profile = { userId: string; displayName: string | null; avatarUrl: string | null };
export type UserSettings = { userId: string; soundEnabled: boolean; musicEnabled: boolean; textSpeed: 'slow' | 'normal' | 'fast'; locale: 'ko' | 'en' };
export type SignInResult = { accessToken: string; refreshToken: string; user: AuthUser };
export type SignUpResult = SignInResult & { profile: Profile; settings: UserSettings };
