import { createClient } from '@supabase/supabase-js';

import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from './env';
import type { Database } from './types';

type CreateServerClientParams = {
  accessToken?: string;
};

/**
 * Creates a Supabase client with the anon key for server components, actions or route handlers.
 * Use it whenever you need to respect the logged user context in server-side code.
 */
export const createSupabaseServerClient = ({ accessToken }: CreateServerClientParams = {}) => {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers,
    },
  });
};

/**
 * Creates a service role client. Never expose this to the browser: it has admin privileges.
 */
export const createSupabaseServiceClient = () =>
  createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
