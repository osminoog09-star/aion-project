import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getPortalPublicEnv } from "@/lib/env/portal-env";

/** Server or client: read-only anon client (RLS applies). No session persistence on server. */
export function createPortalSupabase() {
  const env = getPortalPublicEnv();
  if (!env) return null;
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
