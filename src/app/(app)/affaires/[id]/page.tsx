import { createClient } from "@/lib/supabase/server";
import { AffaireOverview } from "@/components/AffaireOverview";
import type { Affaire, Client, Contact } from "@/lib/types";

export default async function AffaireOverviewPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: affaire }, devisRes, toolListRes, blRes, { data: clients }, { data: contacts }] = await Promise.all([
    supabase.from("affaires").select("*").eq("id", params.id).single(),
    supabase.from("devis").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
    supabase.from("tool_list_items").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
    supabase.from("bons_livraison").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
    supabase.from("clients").select("*").order("raison_sociale"),
    supabase.from("contacts").select("*").order("nom"),
  ]);

  return (
    <AffaireOverview
      affaire={affaire as Affaire}
      clients={(clients ?? []) as Client[]}
      contacts={(contacts ?? []) as Contact[]}
      counts={{
        devis: devisRes.count ?? 0,
        toolList: toolListRes.count ?? 0,
        bl: blRes.count ?? 0,
      }}
    />
  );
}
