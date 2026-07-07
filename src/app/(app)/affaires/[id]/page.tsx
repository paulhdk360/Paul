import { createClient } from "@/lib/supabase/server";
import { AffaireOverview } from "@/components/AffaireOverview";
import type { Affaire, Client } from "@/lib/types";

export default async function AffaireOverviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: affaire }, devisRes, toolListRes, blRes, { data: clients }] = await Promise.all([
    supabase.from("affaires").select("*").eq("id", params.id).single(),
    supabase.from("devis").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
    supabase.from("tool_list_items").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
    supabase.from("bons_livraison").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
    supabase.from("clients").select("*").order("nom"),
  ]);

  return (
    <AffaireOverview
      affaire={affaire as Affaire}
      clients={(clients ?? []) as Client[]}
      counts={{
        devis: devisRes.count ?? 0,
        toolList: toolListRes.count ?? 0,
        bl: blRes.count ?? 0,
      }}
    />
  );
}
