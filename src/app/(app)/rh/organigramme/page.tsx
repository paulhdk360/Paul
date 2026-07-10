import { createClient } from "@/lib/supabase/server";
import { blockAtelierGlobal, blockOperateurGlobal } from "@/lib/auth";
import { OrganigrammeManager } from "@/components/OrganigrammeManager";
import type { Employe } from "@/lib/types";

export default async function OrganigrammePage() {
  await blockOperateurGlobal();
  await blockAtelierGlobal();
  const supabase = createClient();
  const { data } = await supabase.from("employes").select("*").eq("actif", true).order("nom");

  return <OrganigrammeManager employes={(data ?? []) as Employe[]} />;
}
