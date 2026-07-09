import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { CatalogueManager } from "@/components/CatalogueManager";
import type { Affaire, CatalogueHistorique, CatalogueOutil } from "@/lib/types";

export default async function CataloguePage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const [{ data: outils }, { data: affaires }, { data: historique }] = await Promise.all([
    supabase.from("catalogue_outils").select("*").order("designation"),
    supabase.from("affaires").select("id, reference").order("reference"),
    supabase.from("catalogue_outils_historique").select("*").order("created_at", { ascending: false }),
  ]);
  return (
    <CatalogueManager
      outils={(outils ?? []) as CatalogueOutil[]}
      affaires={(affaires ?? []) as Pick<Affaire, "id" | "reference">[]}
      historique={(historique ?? []) as CatalogueHistorique[]}
    />
  );
}
