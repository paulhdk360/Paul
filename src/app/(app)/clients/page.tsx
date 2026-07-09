import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { ClientsManager } from "@/components/ClientsManager";
import type { Client, Contact } from "@/lib/types";

export default async function ClientsPage() {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const supabase = createClient();
  const [{ data: clients }, { data: contacts }] = await Promise.all([
    supabase.from("clients").select("*").order("raison_sociale"),
    supabase.from("contacts").select("*").order("nom"),
  ]);
  return <ClientsManager clients={(clients ?? []) as Client[]} contacts={(contacts ?? []) as Contact[]} />;
}
