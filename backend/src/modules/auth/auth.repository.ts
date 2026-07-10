import type { AuthUser } from './auth.types.js';

export const authRepository = {
  async findUserByEmail(email: string): Promise<AuthUser | null> {
    return { id: 'demo-user', email };
  }
};
