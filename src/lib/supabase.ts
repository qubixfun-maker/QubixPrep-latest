import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    // This will now throw at runtime if vars are missing, not at build time.
    throw new Error('Supabase URL or Anon Key is missing from environment variables.');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseKey);
  return supabaseInstance;
};

// Use a proxy to lazily initialize the Supabase client on first access.
// This prevents the client from being initialized during the build process.
export const supabase = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get: (target, prop) => {
    // Forward property access to the lazily-initialized client.
    return Reflect.get(getSupabaseClient(), prop);
  },
});
