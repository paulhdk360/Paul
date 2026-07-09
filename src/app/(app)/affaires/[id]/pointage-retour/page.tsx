import { createClient } from "@/lib/supabase/server";
import { blockOperateur } from "@/lib/auth";
import { PointageRetourManager } from "@/components/PointageRetourManager";
import type { BonLivraison, CatalogueOutil, ToolListItem } from "@/lib/types";

export default async function PointageRetourPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  const supabase = createClient();
  const [{ data: items }, { data: bls }, { data: outils }] = await Promise.all([
    supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index"),
    supabase.from("bons_livraison").select("*").eq("affaire_id", params.id).order("numero_bl"),
    supabase.from("catalogue_outils").select("*"),
  ]);

  return (
    <PointageRetourManager
      affaireId={params.id}
      items={(items ?? []) as ToolListItem[]}
      bls={(bls ?? []) as BonLivraison[]}
      outils={(outils ?? []) as CatalogueOutil[]}
    />
  );
}
