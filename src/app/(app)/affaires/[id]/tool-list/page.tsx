import { createClient } from "@/lib/supabase/server";
import { ToolListManager } from "@/components/ToolListManager";
import type { BonLivraison, ToolListItem } from "@/lib/types";

export default async function ToolListPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: items }, { data: bls }] = await Promise.all([
    supabase.from("tool_list_items").select("*").eq("affaire_id", params.id).order("item_index"),
    supabase.from("bons_livraison").select("*").eq("affaire_id", params.id).order("numero_bl"),
  ]);

  return (
    <ToolListManager
      affaireId={params.id}
      items={(items ?? []) as ToolListItem[]}
      bls={(bls ?? []) as BonLivraison[]}
    />
  );
}
