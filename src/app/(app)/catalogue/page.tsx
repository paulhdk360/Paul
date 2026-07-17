import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal } from "@/lib/auth";
import { CatalogueManager } from "@/components/CatalogueManager";
import type { Affaire, CatalogueAccessoire, CatalogueHistorique, CatalogueOutil } from "@/lib/types";

export default async function CataloguePage() {
  await blockOperateurGlobal();
  const supabase = createClient();
  const [{ data: outils }, { data: affaires }, { data: historique }, { data: accessoires }] = await Promise.all([
    supabase.from("catalogue_outils").select("*").order("designation"),
    supabase.from("affaires").select("id, reference").order("reference"),
    supabase.from("catalogue_outils_historique").select("*").order("created_at", { ascending: false }),
    supabase.from("catalogue_accessoires").select("*"),
  ]);
  return (
    <CatalogueManager
      outils={(outils ?? []) as CatalogueOutil[]}
      affaires={(affaires ?? []) as Pick<Affaire, "id" | "reference">[]}
      historique={(historique ?? []) as CatalogueHistorique[]}
      accessoires={(accessoires ?? []) as CatalogueAccessoire[]}
    />
  );
}
