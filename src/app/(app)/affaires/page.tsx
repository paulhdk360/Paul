import { createClient } from "@/lib/supabase/server";
import { AffairesManager } from "@/components/AffairesManager";
import type { Affaire, Client, Contact } from "@/lib/types";

export default async function AffairesPage() {
  const supabase = createClient();
  const [{ data: affaires }, { data: clients }, { data: contacts }] = await Promise.all([
    supabase.from("affaires").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("raison_sociale"),
    supabase.from("contacts").select("*").order("nom"),
  ]);
  return (
    <AffairesManager
      affaires={(affaires ?? []) as Affaire[]}
      clients={(clients ?? []) as Client[]}
      contacts={(contacts ?? []) as Contact[]}
    />
  );
}
