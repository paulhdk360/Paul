import { createClient } from "@/lib/supabase/server";
import { blockAtelier, blockOperateur } from "@/lib/auth";
import { AffaireOverview } from "@/components/AffaireOverview";
import type { Achat, Affaire, Client, Contact, Profile } from "@/lib/types";

export default async function AffaireOverviewPage({ params }: { params: { id: string } }) {
  await blockOperateur(params.id);
  await blockAtelier(params.id);
  const supabase = createClient();
  const [{ data: affaire }, devisRes, toolListRes, blRes, { data: clients }, { data: contacts }, { data: achats }, { data: profiles }] =
    await Promise.all([
      supabase.from("affaires").select("*").eq("id", params.id).single(),
      supabase.from("devis").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
      supabase.from("tool_list_items").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
      supabase.from("bons_livraison").select("id", { count: "exact", head: true }).eq("affaire_id", params.id),
      supabase.from("clients").select("*").order("raison_sociale"),
      supabase.from("contacts").select("*").order("nom"),
      supabase.from("achats").select("*").eq("affaire_id", params.id).order("date_achat", { ascending: false }),
      supabase.from("profiles").select("*").eq("role", "atelier").order("full_name"),
    ]);

  return (
    <AffaireOverview
      affaire={affaire as Affaire}
      clients={(clients ?? []) as Client[]}
      contacts={(contacts ?? []) as Contact[]}
      achats={(achats ?? []) as Achat[]}
      atelierProfiles={(profiles ?? []) as Profile[]}
      counts={{
        devis: devisRes.count ?? 0,
        toolList: toolListRes.count ?? 0,
        bl: blRes.count ?? 0,
      }}
    />
  );
}
