import { createClient } from "@/lib/supabase/server";
import { AffairesManager } from "@/components/AffairesManager";
import type { Affaire, Client } from "@/lib/types";

export default async function AffairesPage() {
  const supabase = createClient();
  const [{ data: affaires }, { data: clients }] = await Promise.all([
    supabase.from("affaires").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("nom"),
  ]);
  return <AffairesManager affaires={(affaires ?? []) as Affaire[]} clients={(clients ?? []) as Client[]} />;
}
