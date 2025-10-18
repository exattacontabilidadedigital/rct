const missingVarMessage = (key: string) =>
  `Missing environment variable "${key}". Check your .env configuration.`;

export const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(missingVarMessage("NEXT_PUBLIC_SUPABASE_URL"));
  }
  return url;
};

export const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(missingVarMessage("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  }
  return key;
};

export const getSupabaseServiceRoleKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(missingVarMessage("SUPABASE_SERVICE_ROLE_KEY"));
  }
  return key;
};
