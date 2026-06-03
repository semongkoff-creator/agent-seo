import { createClient, type SupabaseClient } from '@supabase/supabase-js';

function createBaseClient(key: string): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });
}

function createMissingClient(message: string): SupabaseClient {
  return new Proxy({} as SupabaseClient, {
    get() {
      throw new Error(message);
    }
  });
}

export const db =
  createBaseClient(process.env.SUPABASE_SERVICE_ROLE_KEY ?? '') ??
  createMissingClient('Missing Supabase service-role configuration');

export function dbAsUser(userId: string) {
  const client =
    createBaseClient(process.env.SUPABASE_ANON_KEY ?? '') ??
    createMissingClient('Missing Supabase anon configuration');

  return Object.assign(client, { __seoAgentUserId: userId }) as SupabaseClient & {
    __seoAgentUserId: string;
  };
}
