import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { BhaManager } from "@/components/BhaManager";
import type { Bha, BhaItem, CatalogueOutil } from "@/lib/types";

export default async function BhaPage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const [{ data: bhas }, { data: items }, { data: outils }] = await Promise.all([
    supabase.from("bha_compositions").select("*").order("created_at", { ascending: false }),
    supabase.from("bha_items").select("*").order("ordre"),
    supabase.from("catalogue_outils").select("*").order("designation"),
  ]);
  return (
    <BhaManager
      bhas={(bhas ?? []) as Bha[]}
      items={(items ?? []) as BhaItem[]}
      outils={(outils ?? []) as CatalogueOutil[]}
    />
  );
}
