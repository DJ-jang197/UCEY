import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv, hasSupabaseEnv } from "@/lib/config/env";

let client: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (!hasSupabaseEnv()) {
    return null;
  }

  if (client) {
    return client;
  }

  const env = getEnv();
  client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
