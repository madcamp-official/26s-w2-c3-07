import type { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export type AuthedRequest = Request & {
  user?: AuthenticatedUser;
};
