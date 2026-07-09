import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for system processes with no user session (the cron
// reminder job) — bypasses RLS entirely, so it must never be exposed to a
// request that isn't already authenticated as the cron job itself.
export function createServiceClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
