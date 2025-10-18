'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAnonKey, getSupabaseUrl } from './env';
import type { Database } from './types';

let browserClient: SupabaseClient<Database> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
};
