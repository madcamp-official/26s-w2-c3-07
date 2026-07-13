import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
import type { Database } from '../shared/types/database.types.js';

const serverAuth = { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false };

export const serviceRoleClient = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: serverAuth
});

export const createUserTokenClient = (accessToken: string) =>
  createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: serverAuth,
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });

export const verifyUserToken = async (accessToken: string) => {
  const { data, error } = await createUserTokenClient(accessToken).auth.getUser(accessToken);
  if (error || !data.user) return null;
  return data.user;
};

export const supabase = serviceRoleClient;
