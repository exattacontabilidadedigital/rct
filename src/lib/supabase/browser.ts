'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAnonKey, getSupabaseUrl } from './env';
import type { Database } from './types';

let browserClient: SupabaseClient<Database> | null = null;

export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    const url = getSupabaseUrl();
    const key = getSupabaseAnonKey();
    
    browserClient = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
      },
    });
  }
  return browserClient;
};
