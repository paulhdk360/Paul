import { createBrowserClient } from "@supabase/ssr";

// Untyped on purpose: table shapes are enforced via the domain types in
// `@/lib/types` at the call sites instead of a fully generated schema.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
