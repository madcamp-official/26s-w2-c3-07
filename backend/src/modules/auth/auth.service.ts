import { authRepository } from './auth.repository.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { AuthenticatedUser } from '../../shared/types/express.types.js';
import type { SignInInput, SignUpInput, UpdateProfileInput, UpdateSettingsInput } from './auth.schema.js';

export const authService = {
  signIn: (input: SignInInput) => authRepository.signIn(input),
  signUp: (input: SignUpInput) => authRepository.signUp(input),
  me: (user: AuthenticatedUser | undefined) => {
    if (!user) throw new AppError(401, 'Authenticated user was not found', 'AUTH_USER_NOT_FOUND');
    return authRepository.getProfile(user.id);
  },
  updateMe: (user: AuthenticatedUser | undefined, input: UpdateProfileInput) => {
    if (!user) throw new AppError(401, 'Authenticated user was not found', 'AUTH_USER_NOT_FOUND');
    return authRepository.updateProfile(user.id, input);
  },
  settings: (user: AuthenticatedUser | undefined) => {
    if (!user) throw new AppError(401, 'Authenticated user was not found', 'AUTH_USER_NOT_FOUND');
    return authRepository.getSettings(user.id);
  },
  updateSettings: (user: AuthenticatedUser | undefined, input: UpdateSettingsInput) => {
    if (!user) throw new AppError(401, 'Authenticated user was not found', 'AUTH_USER_NOT_FOUND');
    return authRepository.updateSettings(user.id, input);
  }
};
