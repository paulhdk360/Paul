import { createClient } from "@/lib/supabase/server";
import { blockOperateurGlobal, requireUser } from "@/lib/auth";
import { WorkordersManager } from "@/components/WorkordersManager";
import type { Affaire, BonLivraison, CatalogueOutil, Profile, ToolListItem, Workorder } from "@/lib/types";

export default async function WorkordersPage() {
  await blockOperateurGlobal();
  const { profile } = await requireUser();
  const supabase = createClient();

  const [{ data: workorders }, { data: affaires }, { data: outils }, { data: items }, { data: bls }, { data: historiqueItems }, { data: profiles }] =
    await Promise.all([
      supabase.from("workorders").select("*").order("created_at", { ascending: false }),
      supabase.from("affaires").select("id, reference"),
      supabase.from("catalogue_outils").select("id, designation, numero_article"),
      supabase.from("tool_list_items").select("id, designation, numero_serie, bl_id"),
      supabase.from("bons_livraison").select("id, numero_bl"),
      supabase
        .from("tool_list_items")
        .select("id, affaire_id, designation, numero_serie, bl_id, retour_decision, retour_confirme_at")
        .eq("retour_confirme", true)
        .order("retour_confirme_at", { ascending: false }),
      supabase.from("profiles").select("*"),
    ]);

  return (
    <WorkordersManager
      workorders={(workorders ?? []) as Workorder[]}
      affaires={(affaires ?? []) as Pick<Affaire, "id" | "reference">[]}
      outils={(outils ?? []) as Pick<CatalogueOutil, "id" | "designation" | "numero_article">[]}
      items={(items ?? []) as Pick<ToolListItem, "id" | "designation" | "numero_serie" | "bl_id">[]}
      bls={(bls ?? []) as Pick<BonLivraison, "id" | "numero_bl">[]}
      historiqueItems={
        (historiqueItems ?? []) as Pick<
          ToolListItem,
          "id" | "affaire_id" | "designation" | "numero_serie" | "bl_id" | "retour_decision" | "retour_confirme_at"
        >[]
      }
      profiles={(profiles ?? []) as Profile[]}
      currentRole={profile.role}
    />
  );
}
