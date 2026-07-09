import { createClient } from "@/lib/supabase/server";
import { blockOperateur } from "@/lib/auth";
import { PointageRetourManager } from "@/components/PointageRetourManager";
import type { Affaire, BonLivraison, CatalogueOutil, PointageRetourCommentaire, Profile, ToolListItem } from "@/lib/types";

export default async function PointageRetourPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  const supabase = createClient();
  const [{ data: affaire }, { data: items }, { data: bls }, { data: outils }, { data: profiles }, { data: commentaires }] = await Promise.all([
    supabase.from("affaires").select("*").eq("id", params.id).single(),
    supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index"),
    supabase.from("bons_livraison").select("*").eq("affaire_id", params.id).order("numero_bl"),
    supabase.from("catalogue_outils").select("*"),
    supabase.from("profiles").select("*"),
    supabase.from("pointage_retour_commentaires").select("*").eq("affaire_id", params.id).order("created_at"),
  ]);

  return (
    <PointageRetourManager
      affaireId={params.id}
      affaire={affaire as Affaire}
      items={(items ?? []) as ToolListItem[]}
      bls={(bls ?? []) as BonLivraison[]}
      outils={(outils ?? []) as CatalogueOutil[]}
      profiles={(profiles ?? []) as Profile[]}
      initialCommentaires={(commentaires ?? []) as PointageRetourCommentaire[]}
    />
  );
}
