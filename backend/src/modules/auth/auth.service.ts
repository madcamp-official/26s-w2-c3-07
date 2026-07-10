import { authRepository } from './auth.repository.js';

export const authService = {
  async signIn(email: string) {
    return authRepository.findUserByEmail(email);
  }
};
